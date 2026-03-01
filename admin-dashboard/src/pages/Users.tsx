import { AlertTriangle, Briefcase, Check, Clock, Eye, Lock, Search, ShieldAlert, ShieldCheck, ShieldOff, Star, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BASE_URL, fetchCustomers, fetchUsers, updateUserStatus } from '../api';
import UserDetailsModal from '../components/UserDetailsModal';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'laborer' | 'customer';
  status?: 'pending' | 'approved' | 'rejected' | 'unverified';
  category?: { _id: string; name: string } | string;
  categories?: { _id: string; name: string }[] | string[];
  phone?: string;
  rating?: number;
  completedJobs?: number;
  accountStatus?: 'active' | 'warned' | 'temp_blocked' | 'perm_blocked';
  experience?: string;
  createdAt: string;
  dob?: string;
  address?: string;
  profileImage?: string;
  idCardImage?: string;
  verificationHistory?: {
    _id?: string;
    status: string;
    submittedData?: {
      name?: string;
      profileImage?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }[];
}

/** For pending laborers, get the display name and image from the latest verification submission */
function getPendingDisplayInfo(laborer: User): { displayName: string; displayImage: string | undefined } {
  let displayName = laborer.name;
  let displayImage = laborer.profileImage;

  if (laborer.status === 'pending' && laborer.verificationHistory?.length) {
    const lastPending = [...laborer.verificationHistory]
      .reverse()
      .find(h => h.status === 'pending' && h.submittedData);
    if (lastPending?.submittedData) {
      displayName = lastPending.submittedData.name || displayName;
      displayImage = lastPending.submittedData.profileImage || displayImage;
    }
  }

  // Fallback for empty names
  if (!displayName || !displayName.trim()) {
    displayName = laborer.email || 'Unknown';
  }

  return { displayName, displayImage };
}

/** Get display category text from a user, preferring categories array */
function getDisplayCategory(user: User): string {
  if (user.categories && Array.isArray(user.categories) && user.categories.length > 0) {
    return user.categories
      .map(c => typeof c === 'object' && c !== null && 'name' in c ? (c as { name: string }).name : c)
      .join(', ');
  }
  if (user.category) {
    if (typeof user.category === 'object' && user.category !== null && 'name' in user.category) {
      return (user.category as { name: string }).name;
    }
    return user.category as string;
  }
  return 'General';
}

const Users = () => {
  const [activeTab, setActiveTab] = useState<'laborers' | 'customers'>('laborers');
  const [laborers, setLaborers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [laborersData, customersData] = await Promise.all([
        fetchUsers('laborer'),
        fetchCustomers()
      ]);
      setLaborers(laborersData);
      setCustomers(customersData);
      console.log('Laborers:', laborersData);
      console.log('Customers:', customersData);
    } catch (error: any) {
      console.error('Error loading users:', error);
      alert(`Error loading users: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleVerify = async (id: string, status: 'approved' | 'rejected') => {
    let rating: number | undefined = undefined;
    let rejectionReason: string | undefined = undefined;

    if (status === 'approved') {
        const ratingInput = window.prompt("Enter rating for this laborer (0-5):", "0");
        if (ratingInput === null) return; // Cancelled
        rating = parseFloat(ratingInput);
        if (isNaN(rating) || rating < 0 || rating > 5) {
            alert("Invalid rating. Please enter a number between 0 and 5.");
            return;
        }
    } else if (status === 'rejected') {
        const reasonInput = window.prompt("Enter reason for rejection (optional):", "");
        if (reasonInput === null) return; // Cancelled
        rejectionReason = reasonInput;
    }

    if (window.confirm(`Are you sure you want to ${status} this laborer?`)) {
      try {
        await updateUserStatus(id, status, rating, rejectionReason);
        loadUsers(); 
        if (detailsUserId === id) {
            setIsDetailsModalOpen(false);
        }
      } catch (error) {
        console.error('Update status error:', error);
        alert('Failed to update status');
      }
    }
  };

  const handleViewDetails = (userId: string) => {
    setDetailsUserId(userId);
    setIsDetailsModalOpen(true);
  };

  const filteredUsers = (activeTab === 'laborers' ? laborers : customers).filter(user => {
    const { displayName } = getPendingDisplayInfo(user);
    const email = user.email || '';
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter || 
                          (['warned', 'temp_blocked', 'perm_blocked'].includes(statusFilter) && user.accountStatus === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const pendingLaborers = laborers.filter(l => l.status === 'pending');


  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 mt-1">Manage laborers, customers, and verification requests.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('laborers')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'laborers'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Laborers
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'customers'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Customers
          </button>
        </div>
      </div>

      {/* Pending Approvals Section (Only for Laborers tab) */}
      {activeTab === 'laborers' && pendingLaborers.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldAlert className="h-32 w-32 text-amber-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ShieldAlert className="h-6 w-6 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-amber-900">Pending Verification Requests</h2>
              <span className="bg-amber-200 text-amber-800 text-xs px-2 py-1 rounded-full font-bold">
                {pendingLaborers.length} New
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingLaborers.map((laborer) => {
                const { displayName, displayImage } = getPendingDisplayInfo(laborer);
                return (
                <div key={laborer._id} className="bg-white rounded-xl p-5 shadow-sm border border-amber-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {displayImage ? (
                          <img 
                            src={`${BASE_URL}${displayImage}`} 
                            alt={displayName} 
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              console.warn('Image failed to load:', `${BASE_URL}${displayImage}`);
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg ${displayImage ? 'hidden' : ''}`}>
                          {displayName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{displayName}</h3>
                          <p className="text-xs text-slate-500">
                            {typeof laborer.category === 'object' && laborer.category !== null 
                              ? (laborer.category as { name: string }).name 
                              : laborer.category || 'General'}
                          </p>
                        </div>
                      </div>
                      <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                        Review Needed
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm text-slate-600">
                        <Briefcase className="h-4 w-4 mr-2 text-slate-400" />
                        {laborer.email}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-50 space-y-3">
                    <button
                      onClick={() => handleViewDetails(laborer._id)}
                      className="w-full flex items-center justify-center py-2 px-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                    >
                      <Eye className="h-4 w-4 mr-1.5" /> View Full Details
                    </button>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleVerify(laborer._id, 'approved')}
                        className="flex-1 flex items-center justify-center py-2 px-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                      >
                        <Check className="h-4 w-4 mr-1.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleVerify(laborer._id, 'rejected')}
                        className="flex-1 flex items-center justify-center py-2 px-3 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors text-sm font-medium"
                      >
                        <X className="h-4 w-4 mr-1.5" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800">
              All {activeTab === 'laborers' ? 'Laborers' : 'Customers'}
            </h2>
            {activeTab === 'laborers' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-1.5 pl-3 pr-8 bg-slate-50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="unverified">Unverified</option>
                <option value="warned">Warned</option>
                <option value="temp_blocked">Temp Blocked</option>
                <option value="perm_blocked">Perm Blocked</option>
              </select>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64 text-sm"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                {activeTab === 'laborers' && (
                  <>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Performance</th>
                  </>
                )}
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const { displayName, displayImage } = getPendingDisplayInfo(user);
                  const categoryText = getDisplayCategory(user);
                  return (
                  <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {displayImage ? (
                          <img 
                            src={`${BASE_URL}${displayImage}`} 
                            alt={displayName} 
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              console.warn('Image failed to load:', `${BASE_URL}${displayImage}`);
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm ${displayImage ? 'hidden' : ''}`}>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-900">{displayName}</div>
                          <div className="text-xs text-slate-500">{user.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{user.email}</div>
                      <div className="text-xs text-slate-400">{user.phone || 'N/A'}</div>
                    </td>
                    {activeTab === 'laborers' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-600">
                            {categoryText}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.status === 'approved' ? (
                            <span className="px-3 py-1 inline-flex items-center text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                              <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                            </span>
                          ) : user.status === 'rejected' ? (
                            <span className="px-3 py-1 inline-flex items-center text-xs font-medium rounded-full bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3 mr-1" /> Rejected
                            </span>
                          ) : user.status === 'unverified' ? (
                            <span className="px-3 py-1 inline-flex items-center text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                              <ShieldAlert className="w-3 h-3 mr-1" /> Unverified
                            </span>
                          ) : (
                            <span className="px-3 py-1 inline-flex items-center text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3 mr-1" /> Pending
                            </span>
                          )}
                          {user.status === 'approved' && user.accountStatus && user.accountStatus !== 'active' && (
                            <span className={`ml-1 px-2 py-0.5 inline-flex items-center text-xs font-medium rounded-full ${
                              user.accountStatus === 'warned' ? 'bg-amber-100 text-amber-700' :
                              user.accountStatus === 'temp_blocked' ? 'bg-orange-100 text-orange-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {user.accountStatus === 'warned' && <><AlertTriangle className="w-3 h-3 mr-0.5" /> Warned</>}
                              {user.accountStatus === 'temp_blocked' && <><Lock className="w-3 h-3 mr-0.5" /> Temp Blocked</>}
                              {user.accountStatus === 'perm_blocked' && <><ShieldOff className="w-3 h-3 mr-0.5" /> Perm Blocked</>}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-slate-600">
                            <Star className="w-4 h-4 text-amber-400 fill-current mr-1" />
                            <span className="font-medium">{user.rating || '0.0'}</span>
                            <span className="mx-2 text-slate-300">|</span>
                            <span>{user.completedJobs || 0} jobs</span>
                          </div>
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {activeTab === 'laborers' && (
                        <button 
                          onClick={() => handleViewDetails(user._id)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1.5 inline-block" />
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={activeTab === 'laborers' ? 7 : 4} className="px-6 py-12 text-center text-slate-500">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>



      <UserDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        userId={detailsUserId}
        onStatusUpdate={handleVerify}
        onAccountAction={loadUsers}
      />
    </div>
  );
};

export default Users;
