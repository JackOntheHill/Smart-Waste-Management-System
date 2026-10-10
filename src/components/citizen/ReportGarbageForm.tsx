import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { WasteType } from '../../types';
import { MapPicker } from '../common/MapPicker';
import { ImageUploader } from '../common/ImageUploader';
import { AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Eye, Phone, FileText } from 'lucide-react';
import { authFetch } from '../../utils/api';

interface ReportGarbageFormProps {
  onSuccess: (reportId: string) => void;
}

export const ReportGarbageForm: React.FC<ReportGarbageFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();

  // Form State
  const [wasteType, setWasteType] = useState<WasteType>('Household / General Waste');
  const [customWasteType, setCustomWasteType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [reporterPhone, setReporterPhone] = useState<string>(user?.phone || '');
  const [images, setImages] = useState<string[]>([]);

  // Location State (Default to Mumbai Civic Area)
  const [latitude, setLatitude] = useState<number>(18.9388);
  const [longitude, setLongitude] = useState<number>(72.8347);
  const [address, setAddress] = useState<string>(
    'Near Dr. Dadabhai Naoroji Road, Fort, Mumbai 400001'
  );
  const [locationMethod, setLocationMethod] = useState<'automatic_gps' | 'manual_map' | 'manual_address'>('manual_map');

  // Duplicate Check State
  const [potentialDuplicates, setPotentialDuplicates] = useState<any[]>([]);

  // Submission & Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Handle Location Change & Duplicate Check
  const handleLocationChange = async (coords: {
    lat: number;
    lng: number;
    address: string;
    method: 'automatic_gps' | 'manual_map' | 'manual_address';
  }) => {
    setLatitude(coords.lat);
    setLongitude(coords.lng);
    setAddress(coords.address);
    setLocationMethod(coords.method);

    try {
      const res = await authFetch('/api/reports/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng,
          wasteType,
        }),
      });
      const data = await res.json();
      if (data.success && data.hasPotentialDuplicate) {
        setPotentialDuplicates(data.nearbyReports || []);
      } else {
        setPotentialDuplicates([]);
      }
    } catch (e) {
      // quiet catch
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Strict validation
    if (images.length < 3) {
      setErrorMsg('Validation Error: A minimum of three (3) distinct photographs of the garbage accumulation is strictly required before submission.');
      return;
    }

    if (wasteType === 'Other' && !customWasteType.trim()) {
      setErrorMsg('Please specify the garbage category under "Other".');
      return;
    }

    if (!reporterPhone.trim() || reporterPhone.trim().length < 8) {
      setErrorMsg('Please enter a valid reporter phone number for civic verification.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await authFetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wasteType,
          customWasteType: wasteType === 'Other' ? customWasteType : undefined,
          description,
          reporterPhone,
          latitude,
          longitude,
          locationAddress: address,
          locationMethod,
          images,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowConfirmModal(false);
        onSuccess(data.report.reportId);
      } else {
        setErrorMsg(data.message || 'Failed to submit report.');
        setShowConfirmModal(false);
      }
    } catch (err: any) {
      setErrorMsg('Network error while lodging report. Please verify connection.');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const isHazardous = wasteType === 'Medical or Hazardous Waste';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 border border-[#E1E5DF] rounded-xl shadow-xs">
        <div className="border-b border-[#E1E5DF] pb-4 mb-6">
          <h2 className="text-xl font-bold text-[#252B27]">Lodge Garbage Accumulation Report</h2>
          <p className="text-xs text-[#69716B] mt-1">
            Provide verifiable photographic evidence and location details for municipal sanitation dispatch.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-[#C53030]/10 border border-[#C53030]/20 rounded-md text-xs text-[#C53030] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Duplicate Warning Banner */}
        {potentialDuplicates.length > 0 && (
          <div className="mb-6 p-4 bg-[#D97706]/10 border border-[#D97706]/20 rounded-lg text-xs text-[#252B27]">
            <div className="flex items-center gap-2 font-semibold text-[#D97706] mb-1">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Potential Duplicate Reports Nearby</span>
            </div>
            <p className="text-[#69716B] mb-2">
              Our system found existing unresolved reports within 300 meters of your selected location:
            </p>
            <div className="space-y-1.5 pl-2 border-l-2 border-[#D97706]/40">
              {potentialDuplicates.map((dup, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-medium">{dup.reportId} · {dup.wasteType}</span>
                  <span className="text-[#69716B]">{dup.distanceMeters}m away ({dup.status})</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#69716B] mt-2">
              If your accumulation is a distinct or separate pile, you may still proceed.
            </p>
          </div>
        )}

        <form onSubmit={handlePreSubmit} className="space-y-6">
          {/* 1. Garbage Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider mb-1.5">
              1. Garbage / Waste Classification *
            </label>
            <select
              value={wasteType}
              onChange={(e) => setWasteType(e.target.value as WasteType)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E1E5DF] rounded-md focus:outline-none focus:border-[#285943] text-[#252B27]"
            >
              <option value="Household / General Waste">Household / General Waste</option>
              <option value="Plastic Waste">Plastic Waste</option>
              <option value="Organic Waste">Organic Waste</option>
              <option value="Electronic Waste">Electronic Waste</option>
              <option value="Construction Debris">Construction Debris</option>
              <option value="Medical or Hazardous Waste">Medical or Hazardous Waste</option>
              <option value="Mixed Waste">Mixed Waste</option>
              <option value="Other">Other (Specify below)</option>
            </select>

            {wasteType === 'Other' && (
              <div className="mt-3">
                <input
                  type="text"
                  required
                  value={customWasteType}
                  onChange={(e) => setCustomWasteType(e.target.value)}
                  placeholder="Specify type of waste (e.g., Abandoned Industrial Metal Scraps)"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E1E5DF] rounded-md focus:outline-none focus:border-[#285943] text-[#252B27]"
                />
              </div>
            )}

            {isHazardous && (
              <div className="mt-3 p-3 bg-[#C53030]/10 border border-[#C53030]/20 rounded-md text-xs text-[#C53030] flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Hazardous / Bio-Medical Waste Alert</span>
                  <span>
                    Medical syringes, chemicals, and toxic materials are automatically routed with highest priority to specialized hazardous handling contractors rather than standard civic tipper trucks.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Location Section */}
          <div className="border-t border-[#E1E5DF] pt-6">
            <div className="mb-2">
              <label className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider">
                2. Location Coordinates &amp; Street Address *
              </label>
              <p className="text-xs text-[#69716B]">
                Allow browser location detection or drag the pin directly on the OpenStreetMap.
              </p>
            </div>

            <MapPicker
              latitude={latitude}
              longitude={longitude}
              address={address}
              locationMethod={locationMethod}
              onChange={handleLocationChange}
              height="300px"
            />
          </div>

          {/* 3. Mandatory Images (Minimum 3) */}
          <div className="border-t border-[#E1E5DF] pt-6">
            <ImageUploader
              images={images}
              onChange={setImages}
              minImages={3}
              maxImages={6}
              label="3. Photographic Evidence (Minimum 3 Photos Required) *"
              helperText="Upload at least three distinct photos showing the pile from different angles, distances, or access perspectives."
            />
          </div>

          {/* 4. Reporter Phone Number */}
          <div className="border-t border-[#E1E5DF] pt-6">
            <label className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider mb-1.5">
              4. Reporter Contact Phone Number *
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 pl-9 text-sm bg-white border border-[#E1E5DF] rounded-md focus:outline-none focus:border-[#285943] text-[#252B27]"
              />
              <Phone className="w-4 h-4 text-[#69716B] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-[#69716B] mt-1">
              Used solely for field collection verification by authorized municipal personnel.
            </p>
          </div>

          {/* 5. Optional Description */}
          <div className="border-t border-[#E1E5DF] pt-6">
            <label className="block text-xs font-semibold text-[#252B27] uppercase tracking-wider mb-1.5">
              5. Optional Landmarks &amp; Notes
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe nearby landmarks, narrow lane constraints, or special access instructions..."
                className="w-full px-3 py-2 text-sm bg-white border border-[#E1E5DF] rounded-md focus:outline-none focus:border-[#285943] text-[#252B27]"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="border-t border-[#E1E5DF] pt-6 flex justify-end">
            <button
              type="submit"
              disabled={images.length < 3}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#285943] hover:bg-[#1e4533] text-white text-sm font-semibold rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Review &amp; Lodge Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Summary Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-[#E1E5DF] shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E1E5DF] pb-3">
              <FileText className="w-5 h-5 text-[#285943]" />
              <h3 className="text-base font-bold text-[#252B27]">Confirm Report Submission</h3>
            </div>

            <p className="text-xs text-[#69716B]">
              Please verify the details below before lodging your civic grievance into the municipal dispatch registry:
            </p>

            <div className="space-y-2 text-xs bg-[#F7F7F2] p-3 rounded-lg border border-[#E1E5DF]">
              <div className="flex justify-between">
                <span className="text-[#69716B]">Garbage Type:</span>
                <span className="font-semibold text-[#252B27]">{wasteType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#69716B]">Photographs:</span>
                <span className="font-semibold text-[#2E7D32]">{images.length} Distinct Photos Attached</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#69716B]">Location:</span>
                <span className="font-semibold text-[#252B27] text-right truncate max-w-[200px]">{address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#69716B]">Contact Phone:</span>
                <span className="font-mono text-[#252B27]">{reporterPhone}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-[#69716B] hover:text-[#252B27] bg-[#F7F7F2] border border-[#E1E5DF] rounded-md transition-colors cursor-pointer"
              >
                Cancel / Edit
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#285943] hover:bg-[#1e4533] rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Submitting to Registry...' : 'Confirm & Lodge Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
