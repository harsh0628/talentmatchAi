import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AppLayout from './layouts/AppLayout';
import JobsPage from './pages/JobsPage';
import CandidatesPage from './pages/CandidatesPage';
import SchedulePage from './pages/SchedulePage';
import EvaluationReportPage from './pages/EvaluationReportPage';
import About from './pages/About';
import CreateJob from './pages/CreateJob';
import AiMatchPage from './pages/AiMatchPage';
import BenchmarksPage from './pages/BenchmarksPage';
import ForbiddenPage from './pages/ForbiddenPage';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import { DataProviders } from './context/DataProviders';
import { useAuth } from './context/AuthContext';

function LoginRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
}

function ProtectedWorkspaceLayout() {
  return (
    <DataProviders>
      <AppLayout />
    </DataProviders>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginRoute />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedWorkspaceLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route element={<RoleGuard allowedRoles={['Admin', 'Recruiter']} />}>
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/candidates" element={<CandidatesPage />} />
            <Route path="/ai-match" element={<AiMatchPage />} />
            <Route path="/benchmarks" element={<BenchmarksPage />} />
            <Route path="/create-job" element={<CreateJob />} />
            <Route path="/edit-job/:jobId" element={<CreateJob />} />
          </Route>

          <Route
            element={<RoleGuard allowedRoles={['Admin', 'Recruiter', 'Interviewer']} />}
          >
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/evaluation-report" element={<EvaluationReportPage />} />
          </Route>

          <Route path="/about" element={<About />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
