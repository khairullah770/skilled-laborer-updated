import { AlertCircle, Briefcase, Calendar, CheckCircle, Clock, CreditCard, Filter, MapPin, Search, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchBookings } from '../api';
import Modal from '../components/Modal';

interface Booking {
  _id: string;
  customer: {
    name: string;
    email: string;
  };
  laborer: {
    name: string;
    category: string;
  };
  service: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  date: string;
  address: string;
  price: number;
  paymentStatus?: 'Pending' | 'Paid';
}

const Bookings = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        const data = await fetchBookings();
        setBookings(data);
      } catch (error) {
        console.error('Error loading bookings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, []);

  const filteredBookings = bookings.filter(booking => {
    const matchesTab = activeTab === 'All' || booking.status === activeTab;
    const matchesSearch = 
      booking.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.laborer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': 
        return <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" /> Completed</span>;
      case 'In Progress': 
        return <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> In Progress</span>;
      case 'Cancelled': 
        return <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><XCircle className="w-3 h-3 mr-1" /> Cancelled</span>;
      default: 
        return <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><AlertCircle className="w-3 h-3 mr-1" /> Pending</span>;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-8">
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
          
          <button className="flex items-center justify-center px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 bg-white text-slate-600 text-sm font-medium transition-colors">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
            >
              {tab}
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-900">{booking.service}</div>
                          <div className="text-xs text-slate-500 flex items-center mt-0.5">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(booking.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{booking.customer?.name}</div>
                      <div className="text-xs text-slate-500">{booking.customer?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600 mr-2">
                          {booking.laborer?.name.charAt(0)}
                        </div>
                        <span className="text-sm text-slate-600">{booking.laborer?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">${booking.price}</div>
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
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <Calendar className="h-8 w-8 text-slate-300" />
                      </div>
                      <p>No bookings found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Booking Details"
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedBooking.service}</h3>
                  <p className="text-sm text-slate-500">ID: {selectedBooking._id.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-xl font-bold text-slate-900">${selectedBooking.price}</div>
                <div className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center mt-1 ${
                  selectedBooking.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  <CreditCard className="w-3 h-3 mr-1" />
                  {selectedBooking.paymentStatus || 'Pending'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Status</span>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Date</span>
                  <div className="flex items-center text-sm font-bold text-slate-800">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    {new Date(selectedBooking.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Location</span>
                  <div className="flex items-center text-sm font-bold text-slate-800">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="truncate max-w-[200px]">{selectedBooking.address}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-xl">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Customer</div>
                  <div className="font-bold text-slate-900">{selectedBooking.customer?.name}</div>
                  <div className="text-sm text-slate-500 truncate">{selectedBooking.customer?.email}</div>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Laborer</div>
                  <div className="font-bold text-slate-900">{selectedBooking.laborer?.name}</div>
                  <div className="text-sm text-slate-500">{selectedBooking.laborer?.category}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Bookings;
