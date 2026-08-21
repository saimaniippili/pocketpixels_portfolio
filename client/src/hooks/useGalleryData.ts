import { trpc } from '@/lib/trpc';
import staticData from '../static-data.json';

export function useGalleryData() {
  if (import.meta.env.PROD) {
    // In production, we are purely static on Vercel. Bypass tRPC entirely.
    return {
      data: staticData.images as any[],
      isLoading: false,
      error: null,
    };
  }

  // In development, use live database so the admin dashboard works
  return trpc.gallery.list.useQuery();
}
