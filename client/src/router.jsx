import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { DifficultyPage } from './pages/DifficultyPage';
import { HomePage } from './pages/HomePage';
import { CaseIntroPage } from './pages/CaseIntroPage';
import { InvestigationLoadingPage } from './pages/InvestigationLoadingPage';

// Feature routes will be registered here as game areas are implemented.
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'difficulty', element: <DifficultyPage /> },
      { path: 'case/:difficulty', element: <CaseIntroPage /> },
      { path: 'investigation/:difficulty', element: <InvestigationLoadingPage /> },
    ],
  },
]);
