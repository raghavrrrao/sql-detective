import { Outlet } from 'react-router-dom';
import { SoundProvider } from '../context/SoundContext';

/**
 * Owns persistent UI shared by future routes. It deliberately has no visual
 * game content until the product screens are designed.
 */
export function RootLayout() {
  return (
    <SoundProvider>
      <Outlet />
    </SoundProvider>
  );
}
