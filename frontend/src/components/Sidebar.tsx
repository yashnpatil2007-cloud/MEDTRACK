import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Navigation, 
  History, 
  Bell, 
  Settings, 
  LogOut, 
  Bed, 
  Inbox, 
  Building2, 
  Ambulance, 
  Users, 
  Activity, 
  BarChart3, 
  FileText, 
  Mail, 
  ShieldAlert, 
  CheckSquare, 
  Cpu, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile
}) => {
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'AMBULANCE':
        return [
          { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'new-request', label: 'New Emergency Request', icon: PlusCircle, badge: 'Active' },
          { id: 'live-tracking', label: 'Live Tracking', icon: Navigation },
          { id: 'history', label: 'Journey History', icon: History },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'HOSPITAL':
        return [
          { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'incoming-requests', label: 'Incoming Requests', icon: Inbox },
          { id: 'active-ambulances', label: 'Active Ambulances', icon: Ambulance },
          { id: 'live-location', label: 'Live Location Map', icon: Navigation },
          { id: 'bed-availability', label: 'Bed Availability', icon: Bed, badge: 'Live' },
          { id: 'history', label: 'Coordination History', icon: History },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'ADMIN':
        return [
          { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'hospitals', label: 'Hospital Verification', icon: Building2 },
          { id: 'ambulances', label: 'Ambulance Fleet', icon: Ambulance },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'requests', label: 'Request Oversight', icon: Activity },
          { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
          { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
          { id: 'contact-messages', label: 'Contact Messages', icon: Mail },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'SUPERADMIN':
        return [
          { id: 'overview', label: 'Platform Health', icon: Cpu },
          { id: 'system-settings', label: 'System Settings', icon: Settings },
          { id: 'admins', label: 'Administrator Provisioning', icon: ShieldAlert },
          { id: 'audit-logs', label: 'Global Audit Logs', icon: FileText },
          { id: 'requests', label: 'Emergency Requests', icon: Activity },
          { id: 'hospitals', label: 'Hospital Registry', icon: Building2 },
          { id: 'settings', label: 'Account Settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-navy-950/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 bg-navy-950 text-slate-300 transition-all duration-300 flex flex-col justify-between border-r border-navy-850 shadow-xl
          ${collapsed ? 'w-20' : 'w-64'}
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Navigation list */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {/* Unit / Hospital Identity Header */}
          <div className={`mb-4 px-3 py-2 rounded-xl bg-navy-900 border border-navy-850 ${collapsed ? 'text-center' : ''}`}>
            {!collapsed ? (
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-teal-400">Connected Identity</p>
                <p className="text-sm font-extrabold text-white truncate">{user?.user_id}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.toLowerCase()}</p>
              </div>
            ) : (
              <span className="text-xs font-bold text-teal-400">ID</span>
            )}
          </div>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center rounded-xl px-3 py-2.5 text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-navy-900'
                  } ${collapsed ? 'justify-center' : 'justify-between'}`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'}`} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom controls: Collapse toggle & Logout */}
        <div className="p-3 border-t border-navy-850 space-y-2">
          {/* Collapse button for desktop */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-navy-900 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : (
              <div className="flex items-center space-x-2 text-xs">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </div>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={() => logout()}
            className={`w-full flex items-center rounded-xl p-2.5 text-xs font-medium text-emergency-400 hover:bg-emergency-900/30 hover:text-emergency-300 transition-colors ${
              collapsed ? 'justify-center' : 'space-x-3'
            }`}
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
