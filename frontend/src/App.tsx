import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';

// Public & Auth Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/AuthPages/Login';
import { AmbulanceRegister } from './pages/AuthPages/AmbulanceRegister';
import { HospitalRegister } from './pages/AuthPages/HospitalRegister';

// Ambulance Pages
import { AmbulanceDashboard } from './pages/Ambulance/AmbulanceDashboard';
import { NewEmergencyRequest } from './pages/Ambulance/NewEmergencyRequest';
import { LiveTracking } from './pages/Ambulance/LiveTracking';
import { JourneyHistory } from './pages/Ambulance/JourneyHistory';
import { AmbulanceSettings } from './pages/Ambulance/AmbulanceSettings';
import { RouteSelectionView } from './pages/Ambulance/RouteSelectionView';
import { PatientView } from './pages/Ambulance/PatientView';
import { NearbyHospitalsView } from './pages/Ambulance/NearbyHospitalsView';

// Common Intercom / Communication
import { CommunicationCenter } from './pages/Common/CommunicationCenter';

// Hospital Pages
import { HospitalDashboard } from './pages/Hospital/HospitalDashboard';
import { IncomingRequests } from './pages/Hospital/IncomingRequests';
import { BedAvailability } from './pages/Hospital/BedAvailability';
import { ActiveAmbulances } from './pages/Hospital/ActiveAmbulances';
import { HospitalHistory } from './pages/Hospital/HospitalHistory';
import { HospitalSettings } from './pages/Hospital/HospitalSettings';

// Admin & Super Admin Pages
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { HospitalManagement } from './pages/Admin/HospitalManagement';
import { AmbulanceManagement } from './pages/Admin/AmbulanceManagement';
import { UserManagement } from './pages/Admin/UserManagement';
import { RequestMonitor } from './pages/Admin/RequestMonitor';
import { AnalyticsView } from './pages/Admin/AnalyticsView';
import { AuditLogsView } from './pages/Admin/AuditLogsView';
import { ContactMessagesView } from './pages/Admin/ContactMessagesView';
import { SuperAdminDashboard } from './pages/SuperAdmin/SuperAdminDashboard';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState<boolean>(false);

  // If user logs in and is on auth page, route to dashboard
  React.useEffect(() => {
    if (isAuthenticated && (currentPage === 'ambulance-login' || currentPage === 'hospital-login' || currentPage === 'ambulance-register' || currentPage === 'hospital-register')) {
      setCurrentPage('dashboard');
    }
  }, [isAuthenticated, currentPage]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center animate-pulse">
          <span className="text-xl font-black">M</span>
        </div>
        <p className="text-xs uppercase tracking-widest text-teal-400 font-bold">Initializing MEDTRACK Grid...</p>
      </div>
    );
  }

  // PUBLIC OR AUTH PAGES (Not Dashboard)
  if (!isAuthenticated || currentPage !== 'dashboard') {
    return (
      <div className="min-h-screen flex flex-col bg-surface-50 text-slate-800 font-sans">
        <ToastContainer />
        <Navbar
          isDashboard={false}
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />

        <main className="flex-1">
          {currentPage === 'home' && <LandingPage onNavigate={handleNavigate} />}
          {currentPage === 'ambulance-login' && <Login onNavigate={handleNavigate} defaultRoleHint="AMBULANCE" />}
          {currentPage === 'hospital-login' && <Login onNavigate={handleNavigate} defaultRoleHint="HOSPITAL" />}
          {currentPage === 'ambulance-register' && <AmbulanceRegister onNavigate={handleNavigate} />}
          {currentPage === 'hospital-register' && <HospitalRegister onNavigate={handleNavigate} />}
        </main>

        <Footer />
      </div>
    );
  }

  // AUTHENTICATED DASHBOARD LAYOUT
  const renderDashboardContent = () => {
    if (!user) return null;

    // AMBULANCE ROLE VIEWS
    if (user.role === 'AMBULANCE') {
      switch (currentTab) {
        case 'overview':
          return <AmbulanceDashboard onNavigateTab={setCurrentTab} />;
        case 'patient':
          return <PatientView onNavigateTab={setCurrentTab} />;
        case 'route':
          return (
            <RouteSelectionView
              onNavigateTab={setCurrentTab}
              onStartJourneySuccess={() => setCurrentTab('live-tracking')}
            />
          );
        case 'nearby-hospitals':
          return <NearbyHospitalsView onNavigateTab={setCurrentTab} />;
        case 'communication':
          return <CommunicationCenter onNavigateTab={setCurrentTab} />;
        case 'new-request':
          return (
            <NewEmergencyRequest
              onSuccess={() => setCurrentTab('patient')}
              onCancel={() => setCurrentTab('overview')}
            />
          );
        case 'live-tracking':
          return <LiveTracking onJourneyCompleted={() => setCurrentTab('history')} />;
        case 'history':
          return <JourneyHistory />;
        case 'notifications':
          return <JourneyHistory />;
        case 'settings':
          return <AmbulanceSettings />;
        default:
          return <AmbulanceDashboard onNavigateTab={setCurrentTab} />;
      }
    }

    // HOSPITAL ROLE VIEWS
    if (user.role === 'HOSPITAL') {
      switch (currentTab) {
        case 'overview':
          return <HospitalDashboard onNavigateTab={setCurrentTab} />;
        case 'incoming-ambulance':
        case 'incoming-requests':
          return <IncomingRequests />;
        case 'active-ambulances':
        case 'live-location':
          return <ActiveAmbulances />;
        case 'bed-availability':
          return <BedAvailability />;
        case 'communication':
          return <CommunicationCenter onNavigateTab={setCurrentTab} />;
        case 'history':
          return <HospitalHistory />;
        case 'notifications':
          return <IncomingRequests />;
        case 'settings':
          return <HospitalSettings />;
        default:
          return <HospitalDashboard onNavigateTab={setCurrentTab} />;
      }
    }

    // ADMIN ROLE VIEWS
    if (user.role === 'ADMIN') {
      switch (currentTab) {
        case 'overview':
          return <AdminDashboard onNavigateTab={setCurrentTab} />;
        case 'hospitals':
          return <HospitalManagement />;
        case 'ambulances':
          return <AmbulanceManagement />;
        case 'users':
          return <UserManagement />;
        case 'requests':
          return <RequestMonitor />;
        case 'analytics':
          return <AnalyticsView />;
        case 'audit-logs':
          return <AuditLogsView />;
        case 'contact-messages':
          return <ContactMessagesView />;
        case 'settings':
          return <AdminDashboard onNavigateTab={setCurrentTab} />;
        default:
          return <AdminDashboard onNavigateTab={setCurrentTab} />;
      }
    }

    // SUPERADMIN ROLE VIEWS
    if (user.role === 'SUPERADMIN') {
      switch (currentTab) {
        case 'overview':
        case 'system-settings':
        case 'admins':
          return <SuperAdminDashboard />;
        case 'audit-logs':
          return <AuditLogsView />;
        case 'requests':
          return <RequestMonitor />;
        case 'hospitals':
          return <HospitalManagement />;
        default:
          return <SuperAdminDashboard />;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-surface-100 text-slate-800 font-sans flex flex-col">
      <ToastContainer />

      {/* Top Header */}
      <Navbar
        isDashboard={true}
        currentPage="dashboard"
        onToggleSidebar={() => setSidebarMobileOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex">
        {/* Role-Specific Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isOpenMobile={sidebarMobileOpen}
          onCloseMobile={() => setSidebarMobileOpen(false)}
        />

        {/* Content Region */}
        <div
          className={`flex-1 transition-all duration-300 p-4 sm:p-6 lg:p-8 ${
            sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
        >
          <div className="max-w-7xl mx-auto pb-12">
            {renderDashboardContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
