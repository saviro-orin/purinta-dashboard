import type { Flash } from './types';

declare module '@inertiajs/core' {
  interface PageProps {
    flash?: Flash;
    socket_path?: string;
  }
}
