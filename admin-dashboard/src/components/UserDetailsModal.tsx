import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AlertTriangle, Briefcase, Calendar, Check, Download, FileText, Lock, Mail, MapPin, Phone, Printer, Shield, ShieldAlert, ShieldOff, Star, Unlock, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { BASE_URL, fetchUserById, laborerAccountAction } from '../api';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onStatusUpdate?: (id: string, status: 'approved' | 'rejected') => void;
  onAccountAction?: () => void;
}

interface VerificationHistory {
    status: string;
    reason?: string;
    timestamp: string;
    submittedData?: {
        name?: string;
        email?: string;
        phone?: string;
        dob?: string;
        address?: string;
        experience?: string;
        categories?: any[];
        profileImage?: string;
        idCardImage?: string;
    };
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  accountStatus?: 'active' | 'warned' | 'temp_blocked' | 'perm_blocked';
  category?: { _id: string; name: string } | string;
  categories?: { _id: string; name: string }[] | string[];
  experience?: string;
  dob?: string;
  address?: string;
  profileImage?: string;
  idCardImage?: string;
  rating?: number;
  completedJobs?: number;
  warnings?: {
    reason: string;
    ratingAtTime?: number;
    completedJobsAtTime?: number;
    createdAt: string;
  }[];
  blockInfo?: {
    type?: string;
    reason?: string;
    blockedAt?: string;
    unblockedAt?: string;
    ratingAtTime?: number;
    completedJobsAtTime?: number;
  };
  verificationHistory?: VerificationHistory[];
  createdAt: string;
  updatedAt: string;
  isPendingReview?: boolean;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, userId, onStatusUpdate, onAccountAction }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserDetails(userId);
    } else {
      setUser(null);
    }
  }, [isOpen, userId]);

  const loadUserDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUserById(id);
      
      // If pending, merge submittedData from history for display
      if (data.status === 'pending' && data.verificationHistory) {
        const lastPending = [...data.verificationHistory]
          .reverse()
          .find((h: any) => h.status === 'pending' && h.submittedData);
        
        if (lastPending && lastPending.submittedData) {
          const sd = lastPending.submittedData;
          // For categories, prefer the populated data from the API response (data.categories has full objects with names)
          // sd.categories only contains raw IDs from the submission
          const mergedData = {
            ...data,
            name: sd.name || data.name || data.email || 'Unknown',
            email: sd.email || data.email,
            phone: sd.phone || data.phone,
            dob: sd.dob || data.dob,
            address: sd.address || data.address,
            experience: sd.experience || data.experience,
            profileImage: sd.profileImage || data.profileImage,
            idCardImage: sd.idCardImage || data.idCardImage,
            isPendingReview: true
          };
          setUser(mergedData);
          return;
        }
      }
      
      // Handle empty name fallback
      if (!data.name || !data.name.trim()) {
        data.name = data.email || 'Unknown';
      }
      
      setUser(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getCategoryName = (cat: { name: string } | string | null | undefined) => {
    if (!cat) return 'N/A';
    if (typeof cat === 'object' && 'name' in cat) return cat.name;
    return cat as string;
  };

  const getSkillsString = () => {
    if (!user?.categories) return 'N/A';
    if (Array.isArray(user.categories)) {
        return user.categories.map((c: { name: string } | string) => 
            typeof c === 'object' && 'name' in c ? c.name : c
        ).join(', ');
    }
    return 'N/A';
  };

  const handleExportPDF = () => {
    if (!user) return;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('User Details Report', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);

    const details = [
        ['Name', user.name],
        ['Email', user.email || 'N/A'],
        ['Phone', user.phone || 'N/A'],
        ['Role', user.role],
        ['Status', user.status],
        ['Category', getCategoryName(user.category)],
        ['Skills', getSkillsString()],
        ['Experience', user.experience || 'N/A'],
        ['Address', user.address || 'N/A'],
        ['Date of Birth', user.dob || 'N/A'],
        ['Rating', user.rating?.toString() || '0'],
        ['Jobs Completed', user.completedJobs?.toString() || '0'],
        ['Joined', new Date(user.createdAt).toLocaleDateString()]
    ];

    autoTable(doc, {
        head: [['Field', 'Value']],
        body: details,
        startY: 40,
    });

    // Verification History
    if (user.verificationHistory && user.verificationHistory.length > 0) {
        const historyData = user.verificationHistory.map(h => [
            new Date(h.timestamp).toLocaleString(),
            h.status,
            h.reason || '-'
        ]);
        
        doc.text('Verification History', 14, (doc as any).lastAutoTable.finalY + 15);
        
        autoTable(doc, {
            head: [['Date', 'Status', 'Reason']],
            body: historyData,
            startY: (doc as any).lastAutoTable.finalY + 20,
        });
    }

    doc.save(`${user.name.replace(/\s+/g, '_')}_details.pdf`);
  };

  const handleExportExcel = () => {
    if (!user) return;
    
    const userData = {
        Name: user.name,
        Email: user.email,
        Phone: user.phone,
        Role: user.role,
        Status: user.status,
        Category: user.category,
        Experience: user.experience,
        Address: user.address,
        DOB: user.dob,
        Rating: user.rating,
        CompletedJobs: user.completedJobs,
        Joined: new Date(user.createdAt).toLocaleDateString()
    };

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([userData]);
    
    // Add history if exists
    if (user.verificationHistory && user.verificationHistory.length > 0) {
        const historyWS = XLSX.utils.json_to_sheet(user.verificationHistory.map(h => ({
            Date: new Date(h.timestamp).toLocaleString(),
            Status: h.status,
            Reason: h.reason
        })));
        XLSX.utils.book_append_sheet(wb, historyWS, "Verification History");
    }

    XLSX.utils.book_append_sheet(wb, ws, "User Details");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `${user.name.replace(/\s+/g, '_')}_details.xlsx`);
  };

  const handleAccountAction = async (action: 'warning' | 'temp_block' | 'perm_block' | 'unblock') => {
    if (!user) return;
    
    const actionLabels: Record<string, string> = {
      warning: 'Issue Warning',
      temp_block: 'Temporarily Block',
      perm_block: 'Permanently Block',
      unblock: 'Unblock',
    };

    const reason = window.prompt(`Enter reason for "${actionLabels[action]}":`);
    if (!reason || !reason.trim()) return;

    if (!window.confirm(`Are you sure you want to ${actionLabels[action].toLowerCase()} this laborer?\n\nReason: ${reason}`)) return;

    try {
      setActionLoading(true);
      await laborerAccountAction(user._id, action, reason.trim());
      alert(`${actionLabels[action]} action performed successfully.`);
      // Reload user details
      await loadUserDetails(user._id);
      onAccountAction?.();
    } catch (err: any) {
      alert(err?.message || 'Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  };

  const getRatingRecommendation = (rating: number, completedJobs: number) => {
    if (completedJobs < 10) return null; // No action if less than 10 services
    if (rating < 3.5) return { level: 'perm_block', label: 'Permanent Block Recommended', color: 'rose', description: 'Rating is below 3.5 — consistent poor performance. Consider permanent block.' };
    if (rating < 3.8) return { level: 'temp_block', label: 'Temporary Block Recommended', color: 'orange', description: 'Rating is below 3.8 — performance needs improvement. Consider temporary block.' };
    if (rating < 4.2) return { level: 'warning', label: 'Warning Recommended', color: 'amber', description: 'Rating is below 4.2 — performance is slipping. Consider issuing a warning.' };
    return { level: 'good', label: 'Good Standing', color: 'emerald', description: 'Rating is 4.2 or above. Laborer is performing well.' };
  };

  const getAccountStatusBadge = (accountStatus?: string) => {
    switch (accountStatus) {
      case 'warned':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Warned</span>;
      case 'temp_blocked':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex items-center gap-1"><Lock className="w-3 h-3" /> Temp Blocked</span>;
      case 'perm_blocked':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 flex items-center gap-1"><ShieldOff className="w-3 h-3" /> Perm Blocked</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 flex items-center gap-1"><Shield className="w-3 h-3" /> Active</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:bg-white print:p-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-6 flex items-center justify-between print:hidden">
            <h2 className="text-xl font-bold text-slate-800">Laborer Details</h2>
            <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Print">
                    <Printer className="w-5 h-5" />
                </button>
                <button onClick={handleExportPDF} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Export PDF">
                    <FileText className="w-5 h-5" />
                </button>
                <button onClick={handleExportExcel} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Export Excel">
                    <Download className="w-5 h-5" />
                </button>
                <button onClick={onClose} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2">
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="p-6 print:p-8">
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : error ? (
                <div className="text-center py-12">
                    <div className="text-rose-500 mb-2">
                        <Shield className="w-12 h-12 mx-auto" />
                    </div>
                    <p className="text-slate-600">{error}</p>
                </div>
            ) : user ? (
                <div className="space-y-8">
                    {/* Pending Review Notice */}
                    {user.isPendingReview && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-amber-900">Pending Verification Data</h4>
                                <p className="text-sm text-amber-700 mt-1">
                                    You are viewing details submitted for review. Approving this laborer will update their profile with these details.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Profile Header */}
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        <div className="shrink-0">
                            {user.profileImage ? (
                                <img 
                                    src={`${BASE_URL}${user.profileImage}`} 
                                    alt={user.name} 
                                    className="w-32 h-32 rounded-2xl object-cover border-4 border-slate-50 shadow-lg"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-4xl font-bold border-4 border-slate-50 shadow-lg">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 uppercase tracking-wide">
                                            {user.role}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${
                                            user.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                            user.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                            'bg-amber-100 text-amber-800'
                                        }`}>
                                            {user.status}
                                        </span>
                                        {user.role === 'laborer' && user.status === 'approved' && getAccountStatusBadge(user.accountStatus)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-slate-500">Joined</div>
                                    <div className="font-medium text-slate-900">{new Date(user.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                <div className="flex items-center text-slate-600">
                                    <Mail className="w-4 h-4 mr-2 text-slate-400" />
                                    {user.email || 'N/A'}
                                </div>
                                <div className="flex items-center text-slate-600">
                                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                                    {user.phone || 'N/A'}
                                </div>
                                <div className="flex items-center text-slate-600">
                                    <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                                    {user.address || 'N/A'}
                                </div>
                                <div className="flex items-center text-slate-600">
                                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                    DOB: {user.dob || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Skills & Experience */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                <Briefcase className="w-5 h-5 mr-2 text-indigo-600" />
                                Professional Info
                            </h3>
                            <div className="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-100">
                                <div>
                                    <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Primary Category</div>
                                    <div className="font-medium text-slate-900">{getCategoryName(user.category)}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Skills</div>
                                    <div className="flex flex-wrap gap-2">
                                        {user.categories && user.categories.length > 0 ? (
                                            user.categories.map((cat: { name: string } | string, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600">
                                                    {typeof cat === 'object' && 'name' in cat ? cat.name : cat}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-slate-500 italic">No specific skills listed</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Experience</div>
                                    <div className="font-medium text-slate-900">{user.experience || 'Not specified'}</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                <Star className="w-5 h-5 mr-2 text-amber-500" />
                                Performance
                            </h3>
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                        <div className="text-2xl font-bold text-indigo-600">{user.rating || 0}</div>
                                        <div className="text-xs text-slate-500 mt-1">Average Rating</div>
                                    </div>
                                    <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                                        <div className="text-2xl font-bold text-emerald-600">{user.completedJobs || 0}</div>
                                        <div className="text-xs text-slate-500 mt-1">Jobs Completed</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rating-Based Management Panel */}
                    {user.role === 'laborer' && user.status === 'approved' && (() => {
                        const rating = user.rating || 0;
                        const jobs = user.completedJobs || 0;
                        const recommendation = getRatingRecommendation(rating, jobs);
                        const isBlocked = user.accountStatus === 'temp_blocked' || user.accountStatus === 'perm_blocked';

                        return (
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                <ShieldAlert className="w-5 h-5 mr-2 text-indigo-600" />
                                Rating Management
                            </h3>
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-5">
                                {/* Current Status */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-semibold text-slate-400 uppercase">Account Status</div>
                                        <div className="mt-1">{getAccountStatusBadge(user.accountStatus)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-semibold text-slate-400 uppercase">Warnings</div>
                                        <div className="text-lg font-bold text-slate-700 mt-1">{user.warnings?.length || 0}</div>
                                    </div>
                                </div>

                                {/* Rating Thresholds */}
                                <div className="bg-white rounded-lg p-4 border border-slate-200">
                                    <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Rating Thresholds (min 10 completed jobs)</div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Warning
                                            </span>
                                            <span className="text-sm font-mono font-medium text-slate-700">Below 4.2</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-orange-400"></span> Temporary Block
                                            </span>
                                            <span className="text-sm font-mono font-medium text-slate-700">Below 3.8</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-rose-400"></span> Permanent Block
                                            </span>
                                            <span className="text-sm font-mono font-medium text-slate-700">Below 3.5</span>
                                        </div>
                                    </div>

                                    {/* Visual rating bar */}
                                    <div className="mt-4 pt-3 border-t border-slate-100">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-slate-500">Current Rating</span>
                                            <span className={`text-sm font-bold ${
                                                rating >= 4.2 ? 'text-emerald-600' :
                                                rating >= 3.8 ? 'text-amber-600' :
                                                rating >= 3.5 ? 'text-orange-600' :
                                                'text-rose-600'
                                            }`}>{rating.toFixed(1)} / 5.0</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full transition-all ${
                                                    rating >= 4.2 ? 'bg-emerald-500' :
                                                    rating >= 3.8 ? 'bg-amber-500' :
                                                    rating >= 3.5 ? 'bg-orange-500' :
                                                    'bg-rose-500'
                                                }`}
                                                style={{ width: `${(rating / 5) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                                            <span>0</span>
                                            <span className="text-rose-400">3.5</span>
                                            <span className="text-orange-400">3.8</span>
                                            <span className="text-amber-400">4.2</span>
                                            <span>5.0</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recommendation */}
                                {recommendation ? (
                                    <div className={`rounded-lg p-4 border ${
                                        recommendation.level === 'good' ? 'bg-emerald-50 border-emerald-200' :
                                        recommendation.level === 'warning' ? 'bg-amber-50 border-amber-200' :
                                        recommendation.level === 'temp_block' ? 'bg-orange-50 border-orange-200' :
                                        'bg-rose-50 border-rose-200'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            {recommendation.level === 'good' ? (
                                                <Shield className="w-4 h-4 text-emerald-600" />
                                            ) : (
                                                <AlertTriangle className={`w-4 h-4 ${
                                                    recommendation.level === 'warning' ? 'text-amber-600' :
                                                    recommendation.level === 'temp_block' ? 'text-orange-600' :
                                                    'text-rose-600'
                                                }`} />
                                            )}
                                            <span className={`text-sm font-bold ${
                                                recommendation.level === 'good' ? 'text-emerald-800' :
                                                recommendation.level === 'warning' ? 'text-amber-800' :
                                                recommendation.level === 'temp_block' ? 'text-orange-800' :
                                                'text-rose-800'
                                            }`}>
                                                {recommendation.label}
                                            </span>
                                        </div>
                                        <p className={`text-sm ${
                                            recommendation.level === 'good' ? 'text-emerald-700' :
                                            recommendation.level === 'warning' ? 'text-amber-700' :
                                            recommendation.level === 'temp_block' ? 'text-orange-700' :
                                            'text-rose-700'
                                        }`}>
                                            {recommendation.description}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-lg p-4 border bg-slate-100 border-slate-200">
                                        <p className="text-sm text-slate-600">
                                            <span className="font-medium">No action needed.</span> This laborer has completed fewer than 10 jobs ({jobs} jobs). Rating management actions are available after 10 completed services.
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="pt-2">
                                    <div className="text-xs font-semibold text-slate-400 uppercase mb-3">Admin Actions</div>
                                    
                                    {isBlocked ? (
                                        <div className="space-y-3">
                                            {user.blockInfo && (
                                                <div className="bg-white rounded-lg p-3 border border-slate-200 text-sm">
                                                    <div className="text-slate-500">Block Type: <span className="font-medium text-slate-700 capitalize">{user.blockInfo.type}</span></div>
                                                    <div className="text-slate-500 mt-1">Reason: <span className="font-medium text-slate-700">{user.blockInfo.reason}</span></div>
                                                    {user.blockInfo.blockedAt && (
                                                        <div className="text-slate-500 mt-1">Blocked on: <span className="font-medium text-slate-700">{new Date(user.blockInfo.blockedAt).toLocaleString()}</span></div>
                                                    )}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleAccountAction('unblock')}
                                                disabled={actionLoading}
                                                className="w-full flex items-center justify-center py-2.5 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
                                            >
                                                <Unlock className="w-4 h-4 mr-2" />
                                                {actionLoading ? 'Processing...' : 'Unblock Laborer'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <button
                                                onClick={() => handleAccountAction('warning')}
                                                disabled={actionLoading || jobs < 10}
                                                className="flex items-center justify-center py-2.5 px-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                                                title={jobs < 10 ? 'Requires at least 10 completed jobs' : 'Issue a warning'}
                                            >
                                                <AlertTriangle className="w-4 h-4 mr-1.5" />
                                                {actionLoading ? '...' : 'Warn'}
                                            </button>
                                            <button
                                                onClick={() => handleAccountAction('temp_block')}
                                                disabled={actionLoading || jobs < 10}
                                                className="flex items-center justify-center py-2.5 px-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                                                title={jobs < 10 ? 'Requires at least 10 completed jobs' : 'Temporarily block'}
                                            >
                                                <Lock className="w-4 h-4 mr-1.5" />
                                                {actionLoading ? '...' : 'Temp Block'}
                                            </button>
                                            <button
                                                onClick={() => handleAccountAction('perm_block')}
                                                disabled={actionLoading || jobs < 10}
                                                className="flex items-center justify-center py-2.5 px-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                                                title={jobs < 10 ? 'Requires at least 10 completed jobs' : 'Permanently block'}
                                            >
                                                <ShieldOff className="w-4 h-4 mr-1.5" />
                                                {actionLoading ? '...' : 'Perm Block'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Warning History */}
                                {user.warnings && user.warnings.length > 0 && (
                                    <div className="pt-2">
                                        <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Warning History</div>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {user.warnings.map((w, idx) => (
                                                <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200 text-sm">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-500 text-xs">{new Date(w.createdAt).toLocaleString()}</span>
                                                        <span className="text-xs text-slate-400">Rating: {w.ratingAtTime?.toFixed(1) || '—'} | Jobs: {w.completedJobsAtTime ?? '—'}</span>
                                                    </div>
                                                    <div className="text-slate-700 mt-1">{w.reason}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        );
                    })()}

                    {/* Documents */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                                Documents
                            </h3>
                            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                                <div className="text-xs font-semibold text-slate-400 uppercase mb-3">ID Card / Passport</div>
                                {user.idCardImage ? (
                                    <div className="relative group">
                                        <img 
                                            src={`${BASE_URL}${user.idCardImage}`} 
                                            alt="ID Card" 
                                            className="w-full h-48 object-contain rounded-lg bg-white border border-slate-200"
                                        />
                                        <a 
                                            href={`${BASE_URL}${user.idCardImage}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white font-medium"
                                        >
                                            View Full Image
                                        </a>
                                    </div>
                                ) : (
                                    <div className="h-48 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 italic">
                                        No ID Card uploaded
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Verification History */}
                    {user.verificationHistory && user.verificationHistory.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4">History Log</h3>
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                                            <th className="px-4 py-3 font-semibold text-slate-600">Reason/Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {user.verificationHistory.map((history, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {new Date(history.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                                        history.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                                        history.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {history.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {history.reason || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {user.status === 'pending' && user.role === 'laborer' && onStatusUpdate && (
                        <div className="flex gap-4 pt-6 border-t border-slate-100 mt-8 print:hidden">
                            <button
                                onClick={() => onStatusUpdate(user._id, 'approved')}
                                className="flex-1 flex items-center justify-center py-3 px-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm hover:shadow-md"
                            >
                                <Check className="w-5 h-5 mr-2" /> Approve Application
                            </button>
                            <button
                                onClick={() => onStatusUpdate(user._id, 'rejected')}
                                className="flex-1 flex items-center justify-center py-3 px-4 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors font-medium"
                            >
                                <X className="w-5 h-5 mr-2" /> Reject Application
                            </button>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
