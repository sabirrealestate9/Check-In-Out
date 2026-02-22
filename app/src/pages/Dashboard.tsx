import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Building2, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import type { DashboardStats, Checklist, Tenant } from '../types';
import { toast } from 'sonner';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentChecklists, setRecentChecklists] = useState<Checklist[]>([]);
  const [upcomingCheckouts, setUpcomingCheckouts] = useState<Tenant[]>([]);
  const [studioOccupancy, setStudioOccupancy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats() as any;
      setStats(response.stats);
      setRecentChecklists(response.recentChecklists || []);
      setUpcomingCheckouts(response.upcomingCheckouts || []);
      setStudioOccupancy(response.studioOccupancy || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Active Tenants',
      value: stats?.activeTenants || 0,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      title: 'Total Studios',
      value: stats?.totalStudios || 0,
      icon: Building2,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      title: 'Occupancy Rate',
      value: `${stats?.occupancyRate || 0}%`,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      title: 'Check-outs This Month',
      value: stats?.checkoutsThisMonth || 0,
      icon: Calendar,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-[#B8B8B8]">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#C9A03F]/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#B8B8B8] text-sm mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Checklists */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Checklists</h2>
            <Clock className="w-5 h-5 text-[#B8B8B8]" />
          </div>
          
          {recentChecklists.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-[#B8B8B8]/50 mx-auto mb-3" />
              <p className="text-[#B8B8B8]">No checklists yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentChecklists.map((checklist) => (
                <div
                  key={checklist.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        checklist.checklistType === 'check_in'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {checklist.checklistType === 'check_in' ? 'Check-In' : 'Check-Out'}
                      </span>
                      <span className="text-white font-medium">{checklist.tenantName}</span>
                    </div>
                    <p className="text-[#B8B8B8] text-sm mt-1">{checklist.studioName}</p>
                  </div>
                  <span className="text-[#B8B8B8] text-sm">
                    {new Date(checklist.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Check-outs */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Upcoming Check-outs</h2>
            <AlertCircle className="w-5 h-5 text-[#C9A03F]" />
          </div>
          
          {upcomingCheckouts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-[#B8B8B8]/50 mx-auto mb-3" />
              <p className="text-[#B8B8B8]">No upcoming check-outs</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingCheckouts.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div>
                    <p className="text-white font-medium">{tenant.fullName}</p>
                    <p className="text-[#B8B8B8] text-sm">{tenant.studioName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#C9A03F] font-medium">
                      {new Date(tenant.checkOutDate).toLocaleDateString()}
                    </p>
                    <p className="text-[#B8B8B8] text-xs">
                      {Math.ceil((new Date(tenant.checkOutDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Studio Occupancy */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Studio Occupancy</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {studioOccupancy.map((studio, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                studio.status === 'occupied'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Building2 className={`w-4 h-4 ${
                  studio.status === 'occupied' ? 'text-green-400' : 'text-[#B8B8B8]'
                }`} />
                <span className={`w-2 h-2 rounded-full ${
                  studio.status === 'occupied' ? 'bg-green-400' : 'bg-[#B8B8B8]'
                }`} />
              </div>
              <p className="text-white font-medium text-sm truncate">{studio.name}</p>
              <p className="text-[#B8B8B8] text-xs mt-1">
                {studio.tenant_count} {studio.tenant_count === 1 ? 'tenant' : 'tenants'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
