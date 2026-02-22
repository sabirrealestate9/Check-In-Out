import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Building2, 
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { studioAPI } from '../services/api';
import type { Studio } from '../types';
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

const Studios: React.FC = () => {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
  });

  useEffect(() => {
    fetchStudios();
  }, []);

  const fetchStudios = async () => {
    try {
      setLoading(true);
      const response = await studioAPI.getAll() as any;
      setStudios(response.studios || []);
    } catch (error) {
      toast.error('Failed to load studios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await studioAPI.create(formData);
      toast.success('Studio created successfully');
      setIsAddDialogOpen(false);
      setFormData({ name: '', address: '', description: '' });
      fetchStudios();
    } catch (error) {
      toast.error('Failed to create studio');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudio) return;
    
    try {
      await studioAPI.update(selectedStudio.id, formData);
      toast.success('Studio updated successfully');
      setIsEditDialogOpen(false);
      setSelectedStudio(null);
      fetchStudios();
    } catch (error) {
      toast.error('Failed to update studio');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this studio?')) return;
    try {
      await studioAPI.delete(id);
      toast.success('Studio deleted successfully');
      fetchStudios();
    } catch (error) {
      toast.error('Failed to delete studio');
    }
  };

  const openEditDialog = (studio: Studio) => {
    setSelectedStudio(studio);
    setFormData({
      name: studio.name,
      address: studio.address || '',
      description: studio.description || '',
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Studios</h1>
          <p className="text-[#B8B8B8]">Manage your property studios</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <button className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Studio
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl">Add New Studio</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm text-[#B8B8B8] mb-1">Studio Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-[#B8B8B8] mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-[#B8B8B8] mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
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
                  Add Studio
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Studio</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-[#B8B8B8] mb-1">Studio Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm text-[#B8B8B8] mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm text-[#B8B8B8] mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
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
                Update Studio
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Studios Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="spinner" />
        </div>
      ) : studios.length === 0 ? (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
          <Building2 className="w-16 h-16 text-[#B8B8B8]/50 mx-auto mb-4" />
          <p className="text-[#B8B8B8]">No studios found</p>
          <p className="text-[#B8B8B8] text-sm mt-1">Add your first studio to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studios.map((studio) => (
            <div
              key={studio.id}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#C9A03F]/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#C9A03F]/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#C9A03F]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{studio.name}</h3>
                    <p className="text-[#B8B8B8] text-sm">
                      {studio.address || 'No address'}
                    </p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-2 hover:bg-white/10 rounded-lg">
                    <MoreVertical className="w-5 h-5 text-[#B8B8B8]" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                    <DropdownMenuItem 
                      onClick={() => openEditDialog(studio)}
                      className="text-white focus:text-white focus:bg-white/5"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {studio.googleDriveFolderId && (
                      <DropdownMenuItem 
                        onClick={() => window.open(`https://drive.google.com/drive/folders/${studio.googleDriveFolderId}`, '_blank')}
                        className="text-white focus:text-white focus:bg-white/5"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in Drive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleDelete(studio.id)}
                      className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {studio.description && (
                <p className="text-[#B8B8B8] text-sm mt-4 line-clamp-2">
                  {studio.description}
                </p>
              )}
              
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[#B8B8B8] text-sm">
                  Added {new Date(studio.createdAt).toLocaleDateString()}
                </span>
                {studio.googleDriveFolderId && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                    Synced
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Studios;
