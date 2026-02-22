import React, { useEffect, useState } from 'react';
import { 
  Folder, 
  File, 
  ChevronRight,
  RefreshCw,
  Search,
  ExternalLink,
  Image,
  Video,
  FileText,
  AlertCircle
} from 'lucide-react';
import { driveAPI } from '../services/api';
import { toast } from 'sonner';

interface DriveItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType: string;
  size?: string;
  createdTime: string;
}

const GoogleDriveBrowser: React.FC = () => {
  const [studios, setStudios] = useState<DriveItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<DriveItem | null>(null);
  const [folderContents, setFolderContents] = useState<DriveItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [driveStatus, setDriveStatus] = useState<{ connected: boolean; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkDriveStatus();
    fetchStudios();
  }, []);

  const checkDriveStatus = async () => {
    try {
      const response = await driveAPI.getStatus() as any;
      setDriveStatus(response);
    } catch (error) {
      setDriveStatus({ connected: false, message: 'Failed to connect to Google Drive' });
    }
  };

  const fetchStudios = async () => {
    try {
      setLoading(true);
      const response = await driveAPI.getStudios() as any;
      setStudios(response.studios || []);
    } catch (error) {
      toast.error('Failed to load studios from Google Drive');
    } finally {
      setLoading(false);
    }
  };

  const openFolder = async (folder: DriveItem) => {
    try {
      setLoading(true);
      const response = await driveAPI.getStudioContents(folder.id) as any;
      setFolderContents(response.contents || []);
      setCurrentFolder(folder);
      setBreadcrumbs([...breadcrumbs, folder]);
    } catch (error) {
      toast.error('Failed to load folder contents');
    } finally {
      setLoading(false);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentFolder(null);
      setFolderContents([]);
      setBreadcrumbs([]);
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      setBreadcrumbs(newBreadcrumbs);
      openFolder(newBreadcrumbs[newBreadcrumbs.length - 1]);
    }
  };

  const syncStudios = async () => {
    try {
      setLoading(true);
      await driveAPI.syncStudios();
      toast.success('Studios synced successfully');
      fetchStudios();
    } catch (error) {
      toast.error('Failed to sync studios');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-400" />;
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-400" />;
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-400" />;
    return <File className="w-5 h-5 text-[#B8B8B8]" />;
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return 'N/A';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const filteredContents = folderContents.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!driveStatus?.connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Google Drive</h1>
          <p className="text-[#B8B8B8]">Browse and manage files in Google Drive</p>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Google Drive Not Connected</h2>
          <p className="text-[#B8B8B8] mb-4">
            {driveStatus?.message || 'Please configure Google Drive integration'}
          </p>
          <button
            onClick={checkDriveStatus}
            className="btn-outline"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Google Drive</h1>
          <p className="text-[#B8B8B8]">Browse and manage files in Google Drive</p>
        </div>
        
        <button
          onClick={syncStudios}
          disabled={loading}
          className="btn-outline flex items-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Sync Studios
        </button>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigateToBreadcrumb(-1)}
            className="text-[#C9A03F] hover:underline"
          >
            Studios
          </button>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="w-4 h-4 text-[#B8B8B8]" />
              <button
                onClick={() => navigateToBreadcrumb(index)}
                className={`${index === breadcrumbs.length - 1 ? 'text-white' : 'text-[#C9A03F] hover:underline'}`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Search */}
      {currentFolder && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B8B8B8]" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="spinner" />
        </div>
      ) : !currentFolder ? (
        // Studios List
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studios.map((studio) => (
            <div
              key={studio.id}
              onClick={() => openFolder(studio)}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#C9A03F]/30 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#C9A03F]/20 flex items-center justify-center">
                  <Folder className="w-6 h-6 text-[#C9A03F]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{studio.name}</h3>
                  <p className="text-[#B8B8B8] text-sm">
                    Created {new Date(studio.createdTime).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#B8B8B8]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Folder Contents
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {filteredContents.length === 0 ? (
            <div className="p-8 text-center text-[#B8B8B8]">
              {searchQuery ? 'No files match your search' : 'This folder is empty'}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredContents.map((item) => (
                <div
                  key={item.id}
                  onClick={() => item.type === 'folder' ? openFolder(item) : null}
                  className={`flex items-center gap-4 p-4 hover:bg-white/5 ${
                    item.type === 'folder' ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    {item.type === 'folder' ? (
                      <Folder className="w-5 h-5 text-[#C9A03F]" />
                    ) : (
                      getFileIcon(item.mimeType)
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{item.name}</p>
                    <p className="text-[#B8B8B8] text-sm">
                      {item.type === 'file' && `Size: ${formatFileSize(item.size)} • `}
                      Created {new Date(item.createdTime).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {item.type === 'file' && (
                    <a
                      href={`https://drive.google.com/file/d/${item.id}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 hover:bg-white/10 rounded-lg"
                    >
                      <ExternalLink className="w-5 h-5 text-[#B8B8B8]" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GoogleDriveBrowser;
