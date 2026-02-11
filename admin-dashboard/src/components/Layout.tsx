import { Bell, Calendar, ChevronDown, Layers, LayoutDashboard, LogOut, Menu, Search, Settings, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { fetchDashboardStats } from '../api';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchDashboardStats();
        setPendingCount(data.pendingApprovals || 0);
      } catch (error) {
        console.error('Error loading stats for notification:', error);
      }
    };
    
    loadStats();
    // Poll every minute for updates
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'User Management' },
    { path: '/services', icon: Layers, label: 'Services' },
    { path: '/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside 
        className={`bg-slate-900 text-white transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-72' : 'w-20'
        } flex-shrink-0 shadow-xl relative z-20`}
      >
        <div className="h-20 flex items-center justify-center border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
          {isSidebarOpen ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="font-bold text-white text-lg">S</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Skilled Labor
              </h1>
            </div>
          ) : (
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="font-bold text-white text-xl">S</span>
            </div>
          )}
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                location.pathname === item.path
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`h-5 w-5 transition-transform duration-200 ${
                location.pathname === item.path ? 'scale-110' : 'group-hover:scale-110'
              }`} />
              {isSidebarOpen && (
                <span className="ml-3 font-medium tracking-wide text-sm">{item.label}</span>
              )}
              {location.pathname === item.path && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800/50 bg-slate-900/50">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors group"
          >
            <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="ml-3 font-medium text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Header */}
        <header className="h-20 bg-white shadow-sm border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors" onClick={() => navigate('/users')}>
              <Bell className="h-6 w-6" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                  {pendingCount}
                </span>
              )}
            </button>
            
            <div className="h-8 w-px bg-slate-200 mx-2"></div>

            <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">Admin User</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold shadow-sm border-2 border-white">
                A
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
