import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Upload, 
  X, 
  Camera, 
  Video,
  FileText,
  Save,
  ArrowLeft
} from 'lucide-react';
import { tenantAPI, checklistAPI } from '../services/api';
import type { Tenant } from '../types';
import { toast } from 'sonner';

const ChecklistForm: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tenantIdParam = searchParams.get('tenantId');
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [signatureData, setSignatureData] = useState<string>('');
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [formData, setFormData] = useState({
    tenantId: tenantIdParam || '',
    furnitureCondition: '',
    appliancesCondition: '',
    wallsPaintCondition: '',
    acCondition: '',
    utilitiesStatus: '',
    cleanlinessStatus: '',
    additionalNotes: '',
  });

  const conditionOptions = ['Excellent', 'Good', 'Fair', 'Poor', 'Needs Repair'];
  const statusOptions = ['Working', 'Partially Working', 'Not Working', 'N/A'];

  useEffect(() => {
    fetchTenants();
    if (tenantIdParam) {
      fetchTenantDetails(parseInt(tenantIdParam));
    }
  }, []);

  useEffect(() => {
    // Initialize signature canvas
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#F6F6F6';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await tenantAPI.getAll({ status: 'active' }) as any;
      setTenants(response.tenants || []);
    } catch (error) {
      console.error('Failed to load tenants');
    }
  };

  const fetchTenantDetails = async (id: number) => {
    try {
      const response = await tenantAPI.getById(id) as any;
      setSelectedTenant(response.tenant);
    } catch (error) {
      console.error('Failed to load tenant details');
    }
  };

  const handleTenantChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tenantId = e.target.value;
    setFormData({ ...formData, tenantId });
    if (tenantId) {
      await fetchTenantDetails(parseInt(tenantId));
    } else {
      setSelectedTenant(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // Signature handling
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setSignatureData('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tenantId) {
      toast.error('Please select a tenant');
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('tenantId', formData.tenantId);
      submitData.append('checklistType', type as string);
      submitData.append('furnitureCondition', formData.furnitureCondition);
      submitData.append('appliancesCondition', formData.appliancesCondition);
      submitData.append('wallsPaintCondition', formData.wallsPaintCondition);
      submitData.append('acCondition', formData.acCondition);
      submitData.append('utilitiesStatus', formData.utilitiesStatus);
      submitData.append('cleanlinessStatus', formData.cleanlinessStatus);
      submitData.append('additionalNotes', formData.additionalNotes);
      submitData.append('digitalSignature', signatureData);

      uploadedFiles.forEach((file) => {
        submitData.append('mediaFiles', file);
      });

      await checklistAPI.create(submitData);
      toast.success(`${type === 'check_in' ? 'Check-In' : 'Check-Out'} completed successfully!`);
      navigate('/tenants');
    } catch (error) {
      toast.error('Failed to submit checklist');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Camera className="w-5 h-5" />;
    if (file.type.startsWith('video/')) return <Video className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#B8B8B8]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {type === 'check_in' ? 'Check-In' : 'Check-Out'} Checklist
          </h1>
          <p className="text-[#B8B8B8]">
            Complete the property condition checklist
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Tenant Selection */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Select Tenant</h2>
          <select
            value={formData.tenantId}
            onChange={handleTenantChange}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white"
            required
          >
            <option value="">Select a tenant...</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.fullName} - {tenant.studioName}
              </option>
            ))}
          </select>

          {selectedTenant && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[#B8B8B8] text-sm">Studio</p>
                  <p className="text-white">{selectedTenant.studioName}</p>
                </div>
                <div>
                  <p className="text-[#B8B8B8] text-sm">Check-In</p>
                  <p className="text-white">{new Date(selectedTenant.checkInDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[#B8B8B8] text-sm">Check-Out</p>
                  <p className="text-white">{new Date(selectedTenant.checkOutDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[#B8B8B8] text-sm">Duration</p>
                  <p className="text-white">{selectedTenant.durationDays} days</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Property Condition */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Property Condition</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-[#B8B8B8] mb-2">Furniture Condition</label>
              <select
                value={formData.furnitureCondition}
                onChange={(e) => setFormData({ ...formData, furnitureCondition: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="">Select condition...</option>
                {conditionOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#B8B8B8] mb-2">Appliances Condition</label>
              <select
                value={formData.appliancesCondition}
                onChange={(e) => setFormData({ ...formData, appliancesCondition: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="">Select condition...</option>
                {conditionOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#B8B8B8] mb-2">Walls/Paint Condition</label>
              <select
                value={formData.wallsPaintCondition}
                onChange={(e) => setFormData({ ...formData, wallsPaintCondition: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="">Select condition...</option>
                {conditionOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#B8B8B8] mb-2">AC Condition</label>
              <select
                value={formData.acCondition}
                onChange={(e) => setFormData({ ...formData, acCondition: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="">Select condition...</option>
                {conditionOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#B8B8B8] mb-2">Utilities Status</label>
              <select
                value={formData.utilitiesStatus}
                onChange={(e) => setFormData({ ...formData, utilitiesStatus: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="">Select status...</option>
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#B8B8B8] mb-2">Cleanliness Status</label>
              <select
                value={formData.cleanlinessStatus}
                onChange={(e) => setFormData({ ...formData, cleanlinessStatus: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
              >
                <option value="">Select status...</option>
                {['Clean', 'Needs Cleaning', 'Not Clean'].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Additional Notes</h2>
          <textarea
            value={formData.additionalNotes}
            onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
            placeholder="Enter any additional observations or notes..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 resize-none"
          />
        </div>

        {/* Media Upload */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Photos & Videos</h2>
          
          <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-[#C9A03F]/50 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-[#B8B8B8] mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Click to upload files</p>
              <p className="text-[#B8B8B8] text-sm">Support images and videos up to 10MB each</p>
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative bg-white/5 rounded-lg p-3">
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="flex items-center gap-2 text-[#B8B8B8]">
                    {getFileIcon(file)}
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                  <p className="text-xs text-[#B8B8B8] mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Digital Signature */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Digital Signature</h2>
            <button
              type="button"
              onClick={clearSignature}
              className="text-sm text-[#C9A03F] hover:underline"
            >
              Clear
            </button>
          </div>
          
          <canvas
            ref={signatureCanvasRef}
            width={600}
            height={150}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full border-2 border-dashed border-white/20 rounded-lg bg-white/5 cursor-crosshair"
          />
          <p className="text-[#B8B8B8] text-sm mt-2">
            Sign above to confirm the checklist accuracy
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 px-6 border border-white/20 rounded-lg text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-[#0B0B0D]/30 border-t-[#0B0B0D] rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Submit Checklist
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChecklistForm;
