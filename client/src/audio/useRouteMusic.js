import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { audio } from './audioManager';

/**
 * Which bed belongs to which part of the game.
 *
 * The score follows the route, so the transition chart falls out of navigation
 * rather than needing to be orchestrated by hand:
 *
 *   menu -> briefing -> investigation -> (solved sting) -> menu
 *
 * The solved sting is the one exception: it is fired by the Case Closed screen
 * rather than by a route, because closing a case does not navigate anywhere.
 * Leaving the board afterwards returns to the menu bed on its own.
 */
function trackFor(pathname) {
  if (pathname.startsWith('/investigation/')) return 'investigation';
  if (pathname.startsWith('/case/')) return 'briefing';
  if (pathname.startsWith('/training')) return 'tutorial';
  // Landing, case selection, career, leaderboard and settings all share the
  // menu bed, so moving between them never restarts the music.
  return 'menu';
}

export function useRouteMusic() {
  const { pathname } = useLocation();

  useEffect(() => {
    audio.playMusic(trackFor(pathname));
  }, [pathname]);
}

export { trackFor };
