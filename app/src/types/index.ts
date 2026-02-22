export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'admin' | 'staff';
}

export interface Tenant {
  id: number;
  fullName: string;
  passportId: string | null;
  contactNumber: string | null;
  email: string | null;
  studioId: number;
  studioName?: string;
  checkInDate: string;
  checkOutDate: string;
  durationDays: number;
  status: 'active' | 'checked_out' | 'cancelled';
  googleDriveFolderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Studio {
  id: number;
  name: string;
  address: string | null;
  description: string | null;
  googleDriveFolderId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Checklist {
  id: number;
  tenantId: number;
  tenantName?: string;
  studioName?: string;
  checklistType: 'check_in' | 'check_out';
  furnitureCondition: string | null;
  appliancesCondition: string | null;
  wallsPaintCondition: string | null;
  acCondition: string | null;
  utilitiesStatus: string | null;
  cleanlinessStatus: string | null;
  additionalNotes: string | null;
  digitalSignature: string | null;
  submittedBy: number;
  submittedByName?: string;
  googleDriveFileId: string | null;
  createdAt: string;
}

export interface MediaFile {
  id: number;
  checklistId: number;
  fileName: string;
  fileType: 'image' | 'video' | 'document';
  fileSize: number;
  googleDriveFileId: string;
  createdAt: string;
}

export interface CompanyPolicy {
  id: number;
  title: string;
  content: string;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  activeTenants: number;
  totalTenants: number;
  checkoutsThisMonth: number;
  totalStudios: number;
  occupancyRate: number;
}

export interface DriveFile {
  id: string;
  name: string;
  type: 'folder' | 'file';
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
}

export interface DriveFolderStructure {
  id: string;
  name: string;
  type: 'folder';
  children: (DriveFolderStructure | DriveFile)[];
}

export interface AuditLog {
  id: number;
  userId: number;
  userName?: string;
  action: string;
  entityType: string;
  entityId: number;
  details: string | null;
  ipAddress: string;
  createdAt: string;
}

export interface ChecklistFormData {
  tenantId: string;
  checklistType: 'check_in' | 'check_out';
  furnitureCondition: string;
  appliancesCondition: string;
  wallsPaintCondition: string;
  acCondition: string;
  utilitiesStatus: string;
  cleanlinessStatus: string;
  additionalNotes: string;
  digitalSignature: string;
  mediaFiles: File[];
}
