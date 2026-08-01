import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { DifficultyPage } from './pages/DifficultyPage';
import { HomePage } from './pages/HomePage';
import { HowToPlayPage } from './pages/HowToPlayPage';
import { CaseIntroPage } from './pages/CaseIntroPage';
import { InvestigationLoadingPage } from './pages/InvestigationLoadingPage';
import { SettingsPage } from './pages/SettingsPage';

// Feature routes will be registered here as game areas are implemented.
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'difficulty', element: <DifficultyPage /> },
      { path: 'how-to-play', element: <HowToPlayPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'case/:difficulty', element: <CaseIntroPage /> },
      { path: 'investigation/:difficulty', element: <InvestigationLoadingPage /> },
    ],
  },
]);
