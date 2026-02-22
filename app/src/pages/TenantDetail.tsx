import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Calendar, 
  Phone, 
  Mail, 
  FileText,
  CheckCircle,
  Download
} from 'lucide-react';
import { tenantAPI } from '../services/api';
import type { Tenant, Checklist } from '../types';
import { toast } from 'sonner';

const TenantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTenantData();
    }
  }, [id]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      const response = await tenantAPI.getById(parseInt(id!)) as any;
      setTenant(response.tenant);
      setChecklists(response.checklists || []);
    } catch (error) {
      toast.error('Failed to load tenant details');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!confirm('Are you sure you want to check out this tenant?')) return;
    try {
      await tenantAPI.checkout(parseInt(id!));
      toast.success('Tenant checked out successfully');
      fetchTenantData();
    } catch (error) {
      toast.error('Failed to check out tenant');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-[#B8B8B8]">Tenant not found</p>
        <button
          onClick={() => navigate('/tenants')}
          className="mt-4 btn-outline"
        >
          Back to Tenants
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/tenants')}
        className="flex items-center gap-2 text-[#B8B8B8] hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Tenants
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#C9A03F]/20 flex items-center justify-center">
            <User className="w-8 h-8 text-[#C9A03F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{tenant.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              {tenant.status === 'active' ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                  Active
                </span>
              ) : tenant.status === 'checked_out' ? (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                  Checked Out
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                  Cancelled
                </span>
              )}
              <span className="text-[#B8B8B8]">{tenant.studioName}</span>
            </div>
          </div>
        </div>

        {tenant.status === 'active' && (
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/checklist/check_out?tenantId=${tenant.id}`)}
              className="btn-outline"
            >
              Check-Out
            </button>
            <button
              onClick={handleCheckout}
              className="btn-primary"
            >
              Complete Stay
            </button>
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#B8B8B8]" />
              <div>
                <p className="text-[#B8B8B8] text-sm">Passport/ID</p>
                <p className="text-white">{tenant.passportId || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-[#B8B8B8]" />
              <div>
                <p className="text-[#B8B8B8] text-sm">Contact Number</p>
                <p className="text-white">{tenant.contactNumber || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#B8B8B8]" />
              <div>
                <p className="text-[#B8B8B8] text-sm">Email</p>
                <p className="text-white">{tenant.email || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stay Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Stay Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-[#B8B8B8]" />
              <div>
                <p className="text-[#B8B8B8] text-sm">Studio</p>
                <p className="text-white">{tenant.studioName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#B8B8B8]" />
              <div>
                <p className="text-[#B8B8B8] text-sm">Check-In Date</p>
                <p className="text-white">{new Date(tenant.checkInDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#B8B8B8]" />
              <div>
                <p className="text-[#B8B8B8] text-sm">Check-Out Date</p>
                <p className="text-white">{new Date(tenant.checkOutDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#B8B8B8]" />
              <div>
                <p className="text-[#B8B8B8] text-sm">Duration</p>
                <p className="text-white">{tenant.durationDays} days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/checklist/check_in?tenantId=${tenant.id}`)}
              className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-left flex items-center gap-3 transition-colors"
            >
              <CheckCircle className="w-5 h-5 text-green-400" />
              New Check-In
            </button>
            <button
              onClick={() => navigate(`/checklist/check_out?tenantId=${tenant.id}`)}
              className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-left flex items-center gap-3 transition-colors"
            >
              <CheckCircle className="w-5 h-5 text-orange-400" />
              New Check-Out
            </button>
            {tenant.googleDriveFolderId && (
              <a
                href={`https://drive.google.com/drive/folders/${tenant.googleDriveFolderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-left flex items-center gap-3 transition-colors"
              >
                <Download className="w-5 h-5 text-blue-400" />
                View in Google Drive
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Checklists */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Checklists</h2>
        
        {checklists.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#B8B8B8]">No checklists yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {checklists.map((checklist) => (
              <div
                key={checklist.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    checklist.checklistType === 'check_in'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {checklist.checklistType === 'check_in' ? 'Check-In' : 'Check-Out'}
                  </span>
                  <div>
                    <p className="text-white">
                      Created on {new Date(checklist.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-[#B8B8B8] text-sm">
                      By {checklist.submittedByName}
                    </p>
                  </div>
                </div>
                {checklist.googleDriveFileId && (
                  <a
                    href={`https://drive.google.com/file/d/${checklist.googleDriveFileId}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm"
                  >
                    View PDF
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantDetail;
