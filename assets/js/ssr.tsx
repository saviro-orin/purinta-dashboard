import { createInertiaApp } from '@inertiajs/react';
import { createElement } from 'react';
import ReactDOMServer from 'react-dom/server';
import pages from './_ssr_pages.ts';
import { AppProviders } from './app-providers';

// biome-ignore lint/suspicious/noExplicitAny: protocol-level payload from Inertia
export function render(page: any) {
  return createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      const component = pages[name];
      if (!component) throw new Error(`SSR page not found: ${name}`);
      return component;
    },
    setup: ({ App, props }) => (
      <App {...props}>
        {({ Component, props: pageProps, key }) => (
          <AppProviders>{createElement(Component, { key: key ?? undefined, ...pageProps })}</AppProviders>
        )}
      </App>
    ),
  });
}
