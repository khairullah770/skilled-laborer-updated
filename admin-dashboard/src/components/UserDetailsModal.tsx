import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Briefcase, Calendar, Check, Download, FileText, Mail, MapPin, Phone, Printer, Shield, Star, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { BASE_URL, fetchUserById } from '../api';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onStatusUpdate?: (id: string, status: 'approved' | 'rejected') => void;
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
  category?: { _id: string; name: string } | string;
  categories?: { _id: string; name: string }[] | string[];
  experience?: string;
  dob?: string;
  address?: string;
  profileImage?: string;
  idCardImage?: string;
  rating?: number;
  completedJobs?: number;
  verificationHistory?: VerificationHistory[];
  createdAt: string;
  updatedAt: string;
  isPendingReview?: boolean;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, userId, onStatusUpdate }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          const mergedData = {
            ...data,
            ...lastPending.submittedData,
            isPendingReview: true
          };
          setUser(mergedData);
          return;
        }
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
                                    <div className="flex items-center gap-2 mt-1">
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
