import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './store/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';

// Admin
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import CompaniesPage from './pages/admin/CompaniesPage';
import CompanyDetailPage from './pages/admin/CompanyDetailPage';
import StaffPage from './pages/admin/StaffPage';
import StaffDetailPage from './pages/admin/StaffDetailPage';
import UsersPage from './pages/admin/UsersPage';

// Staff
import StaffLayout from './layouts/StaffLayout';
import StaffDashboard from './pages/staff/StaffDashboard';
import TasksPage from './pages/staff/TasksPage';
import StaffCompaniesPage from './pages/staff/StaffCompaniesPage';
import StaffCompanyDetailPage from './pages/staff/StaffCompanyDetailPage';
import StaffCalendarPage from './pages/staff/StaffCalendarPage';
import CompletedTasksPage from './pages/staff/CompletedTasksPage';
import PRProjectsPage from './pages/staff/PRProjectsPage';
import ShootsPage from './pages/staff/ShootsPage';
import MessagingPage from './pages/staff/MessagingPage';
import StaffAnalyticsPage from './pages/staff/StaffAnalyticsPage';
import KanbanPage from './pages/staff/KanbanPage';
import TimeTrackingPage from './pages/staff/TimeTrackingPage';
import NotesPage from './pages/staff/NotesPage';

// Client
import ClientLayout from './layouts/ClientLayout';
import ClientDashboard from './pages/client/ClientDashboard';
import MediaLibraryPage from './pages/client/MediaLibraryPage';
import ClientTasksPage from './pages/client/ClientTasksPage';
import ClientCompletedPage from './pages/client/ClientCompletedPage';
import ServicesPage from './pages/client/ServicesPage';
import ClientSettingsPage from './pages/client/ClientSettingsPage';
import ClientMessagingPage from './pages/client/ClientMessagingPage';
import SurveyPage from './pages/client/SurveyPage';
import ClientAnalyticsPage from './pages/client/ClientAnalyticsPage';
import ClientTeamPage from './pages/client/ClientTeamPage';

// New feature pages
import ActivityLogPage from './pages/admin/ActivityLogPage';
import OnboardingPage from './pages/client/OnboardingPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import StaffSettingsPage from './pages/staff/StaffSettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const routes: Record<string, string> = {
    ADMIN: '/admin',
    AGENCY_STAFF: '/staff',
    COMPANY_USER: '/client',
  };
  return <Navigate to={routes[user.globalRole] || '/login'} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RoleRedirect />} />

            {/* Admin Panel */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="companies/:id" element={<CompanyDetailPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="staff/:id" element={<StaffDetailPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="messaging" element={<MessagingPage />} />
              <Route path="activity-log" element={<ActivityLogPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Staff Panel */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute roles={['ADMIN', 'AGENCY_STAFF']}>
                  <StaffLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StaffDashboard />} />
              <Route path="analytics" element={<StaffAnalyticsPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="kanban" element={<KanbanPage />} />
              <Route path="time-tracking" element={<TimeTrackingPage />} />
              <Route path="messaging" element={<MessagingPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="companies" element={<StaffCompaniesPage />} />
              <Route path="companies/:id" element={<StaffCompanyDetailPage />} />
              <Route path="calendar" element={<StaffCalendarPage />} />
              <Route path="pr" element={<PRProjectsPage />} />
              <Route path="shoots" element={<ShootsPage />} />
              <Route path="completed" element={<CompletedTasksPage />} />
              <Route path="settings" element={<StaffSettingsPage />} />
            </Route>

            {/* Client Panel */}
            <Route
              path="/client"
              element={
                <ProtectedRoute roles={['ADMIN', 'COMPANY_USER']}>
                  <ClientLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ClientDashboard />} />
              <Route path="analytics" element={<ClientAnalyticsPage />} />
              <Route path="media" element={<MediaLibraryPage />} />
              <Route path="tasks" element={<ClientTasksPage />} />
              <Route path="completed" element={<ClientCompletedPage />} />
              <Route path="services" element={<ProtectedRoute membershipRoles={['OWNER']}><ServicesPage /></ProtectedRoute>} />
              <Route path="messaging" element={<ClientMessagingPage />} />
              <Route path="team" element={<ProtectedRoute membershipRoles={['OWNER']}><ClientTeamPage /></ProtectedRoute>} />
              <Route path="surveys" element={<ProtectedRoute membershipRoles={['OWNER']}><SurveyPage /></ProtectedRoute>} />
              <Route path="onboarding" element={<ProtectedRoute membershipRoles={['OWNER']}><OnboardingPage /></ProtectedRoute>} />
              <Route path="settings" element={<ClientSettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
