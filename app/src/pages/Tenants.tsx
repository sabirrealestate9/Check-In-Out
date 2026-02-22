import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  MoreVertical,
  User,
  Calendar,
  Building2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { tenantAPI, studioAPI } from '../services/api';
import type { Tenant, Studio } from '../types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Tenants: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    passportId: '',
    contactNumber: '',
    email: '',
    studioId: '',
    checkInDate: '',
    checkOutDate: '',
  });

  useEffect(() => {
    fetchTenants();
    fetchStudios();
  }, [searchQuery, statusFilter]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      
      const response = await tenantAPI.getAll(params) as any;
      setTenants(response.tenants || []);
    } catch (error) {
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudios = async () => {
    try {
      const response = await studioAPI.getAll() as any;
      setStudios(response.studios || []);
    } catch (error) {
      console.error('Failed to load studios');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tenantAPI.create({
        ...formData,
        studioId: parseInt(formData.studioId),
      });
      toast.success('Tenant created successfully');
      setIsAddDialogOpen(false);
      setFormData({
        fullName: '',
        passportId: '',
        contactNumber: '',
        email: '',
        studioId: '',
        checkInDate: '',
        checkOutDate: '',
      });
      fetchTenants();
    } catch (error) {
      toast.error('Failed to create tenant');
    }
  };

  const handleCheckout = async (id: number) => {
    if (!confirm('Are you sure you want to check out this tenant?')) return;
    try {
      await tenantAPI.checkout(id);
      toast.success('Tenant checked out successfully');
      fetchTenants();
    } catch (error) {
      toast.error('Failed to check out tenant');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        );
      case 'checked_out':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Checked Out
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Tenants</h1>
          <p className="text-[#B8B8B8]">Manage tenant information and check-ins</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <button className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Tenant
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Add New Tenant</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm text-[#B8B8B8] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#B8B8B8] mb-1">Passport/ID</label>
                  <input
                    type="text"
                    value={formData.passportId}
                    onChange={(e) => setFormData({ ...formData, passportId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#B8B8B8] mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-[#B8B8B8] mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-[#B8B8B8] mb-1">Studio *</label>
                <select
                  required
                  value={formData.studioId}
                  onChange={(e) => setFormData({ ...formData, studioId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                >
                  <option value="">Select Studio</option>
                  {studios.map((studio) => (
                    <option key={studio.id} value={studio.id}>{studio.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#B8B8B8] mb-1">Check-In Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#B8B8B8] mb-1">Check-Out Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.checkOutDate}
                    onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Add Tenant
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B8B8B8]" />
          <input
            type="text"
            placeholder="Search tenants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="checked_out">Checked Out</option>
        </select>
      </div>

      {/* Tenants Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-[#B8B8B8] font-medium">Tenant</th>
                <th className="text-left p-4 text-[#B8B8B8] font-medium">Studio</th>
                <th className="text-left p-4 text-[#B8B8B8] font-medium">Check-In</th>
                <th className="text-left p-4 text-[#B8B8B8] font-medium">Check-Out</th>
                <th className="text-left p-4 text-[#B8B8B8] font-medium">Status</th>
                <th className="text-right p-4 text-[#B8B8B8] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="spinner mx-auto" />
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#B8B8B8]">
                    No tenants found
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#C9A03F]/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-[#C9A03F]" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{tenant.fullName}</p>
                          <p className="text-[#B8B8B8] text-sm">{tenant.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#B8B8B8]" />
                        <span className="text-white">{tenant.studioName}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#B8B8B8]" />
                        <span className="text-white">
                          {new Date(tenant.checkInDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#B8B8B8]" />
                        <span className="text-white">
                          {new Date(tenant.checkOutDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(tenant.status)}</td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-2 hover:bg-white/10 rounded-lg">
                          <MoreVertical className="w-5 h-5 text-[#B8B8B8]" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                          <DropdownMenuItem 
                            onClick={() => navigate(`/tenants/${tenant.id}`)}
                            className="text-white focus:text-white focus:bg-white/5"
                          >
                            View Details
                          </DropdownMenuItem>
                          {tenant.status === 'active' && (
                            <DropdownMenuItem 
                              onClick={() => handleCheckout(tenant.id)}
                              className="text-orange-400 focus:text-orange-400 focus:bg-orange-500/10"
                            >
                              Check Out
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tenants;
