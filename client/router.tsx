import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Two routes don't justify a router dependency: history.pushState plus a
// popstate listener covers navigation, and the server already serves
// index.html for every non-API path.
const NavigateContext = createContext<((to: string) => void) | null>(null);

export interface Route {
  /** Path pattern like `/` or `/market/:chainId/:id`. Segments starting with `:` become params. */
  path: string;
  render: (params: Record<string, string>) => ReactNode;
}

/** Matches a pattern like `/market/:chainId/:id` against a pathname, returning its params or null. */
export function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const patternSegments = pattern.split('/').filter(Boolean);
  const pathSegments = pathname.split('/').filter(Boolean);
  if (patternSegments.length !== pathSegments.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternSegments.length; i++) {
    const patternSegment = patternSegments[i] as string;
    const pathSegment = pathSegments[i] as string;
    if (patternSegment.startsWith(':')) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment);
    } else if (patternSegment !== pathSegment) {
      return null;
    }
  }
  return params;
}

export function Router({ routes, fallback }: { routes: Route[]; fallback: ReactNode }) {
  const [path, setPath] = useState(() => (typeof window === 'undefined' ? '/' : window.location.pathname));

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    window.history.pushState(null, '', to);
    setPath(to);
    window.scrollTo(0, 0);
  }, []);

  let page = fallback;
  for (const route of routes) {
    const params = matchPath(route.path, path);
    if (params) {
      page = route.render(params);
      break;
    }
  }

  return <NavigateContext.Provider value={navigate}>{page}</NavigateContext.Provider>;
}

export function Link({ href, onClick, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const navigate = useContext(NavigateContext);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      !navigate ||
      !href ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    navigate(href);
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
