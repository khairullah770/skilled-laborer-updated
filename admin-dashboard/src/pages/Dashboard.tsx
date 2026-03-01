import { ArrowDown, ArrowUp, Briefcase, Calendar, Clock, DollarSign, TrendingUp } from 'lucide-react';
import type { ElementType } from 'react';
import { useEffect, useState } from 'react';
import { fetchDashboardStats } from '../api';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: ElementType;
  trend: 'up' | 'down';
  color: string;
}

interface DashboardStats {
  totalUsers: number;
  totalLaborers: number;
  activeBookings: number;
  totalRevenue: number;
  pendingApprovals: number;
  recentBookings: any[];
}

const StatCard = ({ title, value, change, icon: Icon, trend, color }: StatCardProps) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
      </div>
      <div className={`p-4 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg shadow-indigo-500/20`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className={`flex items-center font-medium ${
        trend === 'up' ? 'text-emerald-500' : 'text-rose-500'
      } bg-slate-50 px-2 py-1 rounded-lg`}>
        {trend === 'up' ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
        {change}
      </span>
      <span className="text-slate-400 ml-3">vs last month</span>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalLaborers: 0,
    activeBookings: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Total Laborers',
      value: stats.totalLaborers.toLocaleString(),
      change: '12%',
      trend: 'up' as const,
      icon: Briefcase,
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      title: 'Active Bookings',
      value: stats.activeBookings.toString(),
      change: '8%',
      trend: 'up' as const,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Total Revenue',
      value: `Rs ${stats.totalRevenue.toLocaleString()}`,
      change: '23%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals.toString(),
      change: '5%',
      trend: 'down' as const,
      icon: Clock,
      color: 'from-amber-500 to-amber-600',
    },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Welcome back, here's what's happening today.</p>
        </div>
        <div className="text-sm bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-slate-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            trend={stat.trend}
            color={stat.color}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-indigo-500" />
              Recent Bookings
            </h2>
            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</button>
          </div>
          
          <div className="space-y-4">
            {stats.recentBookings.length > 0 ? (
              stats.recentBookings.map((booking) => (
                <div key={booking._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 font-bold shadow-sm group-hover:scale-110 transition-transform">
                      {booking.service.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{booking.service}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {booking.customer?.name} • {new Date(booking.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">Rs {booking.price}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                      booking.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      booking.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500">No recent bookings found</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Stats / Activity */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-emerald-500" />
              Activity Feed
            </h2>
          </div>
          <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
             {[1, 2, 3].map((_, i) => (
                <div key={i} className="relative pl-10">
                   <div className="absolute left-2 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-indigo-500 shadow-sm ring-2 ring-indigo-50"></div>
                   <p className="text-sm font-medium text-slate-800">New user registered</p>
                   <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                </div>
             ))}
             <div className="relative pl-10">
                <div className="absolute left-2 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm ring-2 ring-emerald-50"></div>
                <p className="text-sm font-medium text-slate-800">Payment received Rs 150</p>
                <p className="text-xs text-slate-400 mt-1">5 hours ago</p>
             </div>
          </div>
          <button className="w-full mt-8 py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
