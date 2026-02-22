import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Plus, 
  Edit2, 
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { policyAPI } from '../services/api';
import type { CompanyPolicy } from '../types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const CompanyPolicies: React.FC = () => {
  const [policies, setPolicies] = useState<CompanyPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPolicy, setExpandedPolicy] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<CompanyPolicy | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await policyAPI.getAll() as any;
      setPolicies(response.policies || []);
    } catch (error) {
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await policyAPI.create(formData);
      toast.success('Policy created successfully');
      setIsAddDialogOpen(false);
      setFormData({ title: '', content: '', category: '' });
      fetchPolicies();
    } catch (error) {
      toast.error('Failed to create policy');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) return;
    
    try {
      await policyAPI.update(selectedPolicy.id, formData);
      toast.success('Policy updated successfully');
      setIsEditDialogOpen(false);
      setSelectedPolicy(null);
      fetchPolicies();
    } catch (error) {
      toast.error('Failed to update policy');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    try {
      await policyAPI.delete(id);
      toast.success('Policy deleted successfully');
      fetchPolicies();
    } catch (error) {
      toast.error('Failed to delete policy');
    }
  };

  const openEditDialog = (policy: CompanyPolicy) => {
    setSelectedPolicy(policy);
    setFormData({
      title: policy.title,
      content: policy.content,
      category: policy.category || '',
    });
    setIsEditDialogOpen(true);
  };

  const togglePolicy = (id: number) => {
    setExpandedPolicy(expandedPolicy === id ? null : id);
  };

  const categories = [...new Set(policies.map(p => p.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Company Policies</h1>
          <p className="text-[#B8B8B8]">Manage company policies and instructions</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <button className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Policy
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Add New Policy</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm text-[#B8B8B8] mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-[#B8B8B8] mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., General, Check-In, Check-Out"
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-[#B8B8B8] mb-1">Content *</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white resize-none"
                />
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
                  Add Policy
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Policy</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-[#B8B8B8] mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm text-[#B8B8B8] mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm text-[#B8B8B8] mb-1">Content *</label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white resize-none"
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button type="submit" className="flex-1 btn-primary">
                Update Policy
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Policies List */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="spinner" />
        </div>
      ) : policies.length === 0 ? (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
          <FileText className="w-16 h-16 text-[#B8B8B8]/50 mx-auto mb-4" />
          <p className="text-[#B8B8B8]">No policies found</p>
          <p className="text-[#B8B8B8] text-sm mt-1">Add your first policy to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category} className="space-y-2">
              {category && (
                <h2 className="text-lg font-semibold text-[#C9A03F] mb-3">{category}</h2>
              )}
              
              {policies
                .filter(p => p.category === category)
                .map((policy) => (
                  <div
                    key={policy.id}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                  >
                    <div
                      onClick={() => togglePolicy(policy.id)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#C9A03F]" />
                        <span className="text-white font-medium">{policy.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(policy);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4 text-[#B8B8B8]" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(policy.id);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                        {expandedPolicy === policy.id ? (
                          <ChevronUp className="w-5 h-5 text-[#B8B8B8]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#B8B8B8]" />
                        )}
                      </div>
                    </div>
                    
                    {expandedPolicy === policy.id && (
                      <div className="px-4 pb-4 pt-2 border-t border-white/5">
                        <div className="prose prose-invert max-w-none">
                          {policy.content.split('\n').map((paragraph, index) => (
                            <p key={index} className="text-[#B8B8B8] mb-2">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                        <p className="text-[#B8B8B8] text-sm mt-4">
                          Last updated: {new Date(policy.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyPolicies;
