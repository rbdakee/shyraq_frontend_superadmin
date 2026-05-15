import { RouterProvider } from 'react-router-dom';
import { useViewportWidth } from '@/hooks/use-viewport-width';
import { MobileNotSupported } from '@/components/feedback/mobile-not-supported';
import { router } from '@/router';

export function AppRoot() {
  const width = useViewportWidth();
  if (width < 768) return <MobileNotSupported />;
  return <RouterProvider router={router} />;
}
