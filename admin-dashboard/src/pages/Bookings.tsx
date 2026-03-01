import { AlertCircle, Briefcase, Calendar, CheckCircle, Clock, CreditCard, DollarSign, MapPin, Search, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { fetchBookings } from '../api';
import Modal from '../components/Modal';

interface Booking {
  _id: string;
  customer: {
    _id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
  } | null;
  laborer: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    profileImage?: string;
    categories?: { _id: string; name: string }[];
  } | null;
  service: string;
  serviceDescription?: string;
  status: 'Pending' | 'Accepted' | 'In Progress' | 'Completed' | 'Cancelled' | 'Declined' | 'Rescheduled';
  scheduledAt: string;
  date: string;
  location?: { address: string; latitude?: number; longitude?: number };
  address: string;
  compensation: number;
  price: number;
  estimatedDurationMin?: number;
  paymentStatus?: 'Pending' | 'Paid';
  createdAt: string;
  updatedAt: string;
}

const Bookings = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchBookings();
        setBookings(data);
      } catch (err: any) {
        console.error('Error loading bookings:', err);
        setError(err?.message || 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, []);

  const getCustomerName = (b: Booking) => {
    if (!b.customer) return 'Unknown';
    return b.customer.name || `${b.customer.firstName || ''} ${b.customer.lastName || ''}`.trim() || b.customer.email || 'Unknown';
  };

  const getLaborerName = (b: Booking) => {
    if (!b.laborer) return 'Unknown';
    return b.laborer.name || b.laborer.email || 'Unknown';
  };

  const getLaborerCategories = (b: Booking) => {
    if (!b.laborer?.categories || !Array.isArray(b.laborer.categories)) return '';
    return b.laborer.categories.map(c => typeof c === 'object' && 'name' in c ? c.name : c).join(', ');
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesTab = activeTab === 'All' || booking.status === activeTab;
      const search = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        getCustomerName(booking).toLowerCase().includes(search) ||
        getLaborerName(booking).toLowerCase().includes(search) ||
        booking.service.toLowerCase().includes(search) ||
        booking._id.toLowerCase().includes(search);
      return matchesTab && matchesSearch;
    });
  }, [bookings, activeTab, searchTerm]);

  const stats = useMemo(() => {
    const completed = bookings.filter(b => b.status === 'Completed');
    const totalEarnings = completed.reduce((sum, b) => sum + (b.compensation || b.price || 0), 0);
    const pending = bookings.filter(b => b.status === 'Pending').length;
    const inProgress = bookings.filter(b => b.status === 'In Progress').length;
    const cancelled = bookings.filter(b => b.status === 'Cancelled').length;
    return { totalEarnings, completedCount: completed.length, pending, inProgress, cancelled, total: bookings.length };
  }, [bookings]);

  const tabs = [
    { label: 'All', count: stats.total },
    { label: 'Pending', count: stats.pending },
    { label: 'In Progress', count: stats.inProgress },
    { label: 'Completed', count: stats.completedCount },
    { label: 'Cancelled', count: stats.cancelled },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': 
        return <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" /> Completed</span>;
      case 'In Progress': 
        return <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> In Progress</span>;
      case 'Cancelled': 
        return <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><XCircle className="w-3 h-3 mr-1" /> Cancelled</span>;
      case 'Accepted':
        return <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800"><CheckCircle className="w-3 h-3 mr-1" /> Accepted</span>;
      case 'Declined':
        return <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"><XCircle className="w-3 h-3 mr-1" /> Declined</span>;
      case 'Rescheduled':
        return <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><Calendar className="w-3 h-3 mr-1" /> Rescheduled</span>;
      default: 
        return <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><AlertCircle className="w-3 h-3 mr-1" /> Pending</span>;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-96 space-y-4">
      <AlertCircle className="h-12 w-12 text-rose-400" />
      <p className="text-slate-600 font-medium">{error}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
        Retry
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Booking Management</h1>
          <p className="text-slate-500 mt-1">Track and manage all service appointments.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64 text-sm"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Bookings</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Completed</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completedCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">In Progress</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Earnings</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">Rs {stats.totalEarnings.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
                ${activeTab === tab.label
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
            >
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.label ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Laborer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => {
                  const customerName = getCustomerName(booking);
                  const laborerName = getLaborerName(booking);
                  const laborerCats = getLaborerCategories(booking);
                  return (
                  <tr key={booking._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {booking.service.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-900">{booking.service}</div>
                          <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                            {booking.address || booking.location?.address || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{customerName}</div>
                      <div className="text-xs text-slate-500">{booking.customer?.email || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 mr-2">
                          {laborerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{laborerName}</div>
                          {laborerCats && <div className="text-xs text-slate-500">{laborerCats}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-600">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                        {new Date(booking.scheduledAt || booking.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {new Date(booking.scheduledAt || booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">Rs {(booking.compensation || booking.price || 0).toLocaleString()}</div>
                      <div className={`text-xs mt-0.5 ${booking.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {booking.paymentStatus || 'Pending'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => {
                          setSelectedBooking(booking);
                          setIsModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-sm bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <Calendar className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="font-medium">No bookings found</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {searchTerm ? 'Try a different search term.' : activeTab !== 'All' ? `No ${activeTab.toLowerCase()} bookings.` : 'No bookings in the system yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Table Footer */}
        {filteredBookings.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-700">{filteredBookings.length}</span> of{' '}
              <span className="font-medium text-slate-700">{bookings.length}</span> bookings
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Booking Details"
      >
        {selectedBooking && (() => {
          const customerName = getCustomerName(selectedBooking);
          const laborerName = getLaborerName(selectedBooking);
          const laborerCats = getLaborerCategories(selectedBooking);
          return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedBooking.service}</h3>
                  <p className="text-sm text-slate-500">ID: {selectedBooking._id.slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-xl font-bold text-slate-900">Rs {(selectedBooking.compensation || selectedBooking.price || 0).toLocaleString()}</div>
                <div className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center mt-1 ${
                  selectedBooking.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  <CreditCard className="w-3 h-3 mr-1" />
                  {selectedBooking.paymentStatus || 'Pending'}
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Status</span>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Scheduled Date</span>
                  <div className="flex items-center text-sm font-bold text-slate-800">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    {new Date(selectedBooking.scheduledAt || selectedBooking.date).toLocaleDateString()}{' '}
                    {new Date(selectedBooking.scheduledAt || selectedBooking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Location</span>
                  <div className="flex items-center text-sm font-bold text-slate-800">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                    <span className="truncate max-w-[250px]">{selectedBooking.address || selectedBooking.location?.address || '—'}</span>
                  </div>
                </div>
                {selectedBooking.estimatedDurationMin && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Est. Duration</span>
                    <span className="text-sm font-bold text-slate-800">{selectedBooking.estimatedDurationMin} min</span>
                  </div>
                )}
                {selectedBooking.serviceDescription && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-sm font-medium text-slate-600">Description</span>
                    <p className="text-sm text-slate-700 mt-1">{selectedBooking.serviceDescription}</p>
                  </div>
                )}
              </div>

              {/* Customer & Laborer */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Customer</div>
                  <div className="font-bold text-slate-900">{customerName}</div>
                  <div className="text-sm text-slate-500 truncate">{selectedBooking.customer?.email || '—'}</div>
                  {selectedBooking.customer?.phone && (
                    <div className="text-sm text-slate-500">{selectedBooking.customer.phone}</div>
                  )}
                </div>
                <div className="p-4 border border-slate-200 rounded-xl">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Laborer</div>
                  <div className="font-bold text-slate-900">{laborerName}</div>
                  {laborerCats && <div className="text-sm text-slate-500">{laborerCats}</div>}
                  {selectedBooking.laborer?.phone && (
                    <div className="text-sm text-slate-500">{selectedBooking.laborer.phone}</div>
                  )}
                </div>
              </div>

              {/* Created / Updated */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span>Created: {new Date(selectedBooking.createdAt).toLocaleString()}</span>
                <span>Updated: {new Date(selectedBooking.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default Bookings;
