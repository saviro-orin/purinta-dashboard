import { go } from '@api3/promise-utils';
import { createInertiaApp, router } from '@inertiajs/react';
import { createElement, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './app-providers';
import Toaster from './components/Toaster';
import { toast } from './components/toast';
import { startThemeWatcher } from './theme';
import type { Flash } from './types';

function applyFlash(flash?: Flash) {
  if (!flash) return;
  if (flash.info) toast.success(flash.info);
  if (flash.error) toast.error(flash.error);
}

createInertiaApp({
  resolve: async (name) => {
    const result = await go(() => import(`./pages/${name}.tsx`));
    if (!result.success) {
      console.error(`Failed to load page "${name}":`, result.error);
      throw result.error;
    }
    return result.data;
  },
  setup({ App, el, props }) {
    startThemeWatcher();

    if (process.env.NODE_ENV !== 'production') {
      void go(() => import('./a11y-audit')).then((result) => {
        if (result.success) result.data.startA11yAudit();
      });
    }

    applyFlash(props.initialPage.props.flash as Flash | undefined);

    router.on('success', (event) => {
      applyFlash(event.detail.page.props.flash as Flash | undefined);
    });

    createRoot(el).render(
      <StrictMode>
        <App {...props}>
          {({ Component, props: pageProps, key }) => (
            <AppProviders>{createElement(Component, { key: key ?? undefined, ...pageProps })}</AppProviders>
          )}
        </App>
        <Toaster />
      </StrictMode>
    );
  },
  http: {
    xsrfHeaderName: 'x-csrf-token',
  },
});
