export type UserRole = 'citizen' | 'worker' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  accountStatus: 'active' | 'pending' | 'suspended';
  workerDetails?: {
    employeeId?: string;
    assignedZone?: string;
    isAvailable?: boolean;
    vehicleType?: string;
  };
}

export type WasteType =
  | 'Household / General Waste'
  | 'Plastic Waste'
  | 'Organic Waste'
  | 'Electronic Waste'
  | 'Construction Debris'
  | 'Medical or Hazardous Waste'
  | 'Mixed Waste'
  | 'Other';

export type ReportStatus =
  | 'Pending'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected'
  | 'Requires Clarification'
  | 'Reopened';

export type ReportPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface AuditEntry {
  action: string;
  changedBy: string;
  changerName: string;
  changerRole: string;
  previousStatus?: ReportStatus;
  newStatus?: ReportStatus;
  explanation: string;
  timestamp: string;
}

export interface CompletionEvidence {
  collectionImages: string[];
  workerVerificationImage: string;
  completionNotes?: string;
  wasteQuantityEstimate?: string;
  submittedAt: string;
  serverRecordedAt: string;
  worker: {
    _id: string;
    name: string;
    phone: string;
    workerDetails?: {
      employeeId?: string;
      assignedZone?: string;
    };
  };
}

export interface CitizenFeedback {
  rating: number;
  satisfied: boolean;
  comment?: string;
  submittedAt: string;
}

export interface ReportItem {
  _id: string;
  reportId: string;
  title: string;
  description: string;
  wasteType: WasteType;
  customWasteType?: string;
  locationAddress: string;
  locationCoordinates: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  locationMethod: 'automatic_gps' | 'manual_map' | 'manual_address';
  images: string[];
  reporterPhone: string;
  reportedBy: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  assignedWorker?: {
    _id: string;
    name: string;
    phone: string;
    workerDetails?: {
      employeeId?: string;
      vehicleType?: string;
    };
  };
  status: ReportStatus;
  priority: ReportPriority;
  startedAt?: string;
  resolvedAt?: string;
  completionEvidence?: CompletionEvidence;
  citizenFeedback?: CitizenFeedback;
  auditHistory: AuditEntry[];
  distanceKm?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintItem {
  _id: string;
  complaintId: string;
  report: ReportItem | string;
  reportId: string;
  submittedBy: string;
  submittedByName: string;
  submittedByRole: 'citizen' | 'worker';
  category: string;
  description: string;
  supportingImages: string[];
  status: 'Submitted' | 'Under Review' | 'Action Required' | 'Resolved' | 'Rejected';
  resolutionNotes?: string;
  reviewedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  _id: string;
  recipient: string;
  type: 'report_status' | 'assignment' | 'completion' | 'complaint_update' | 'system';
  title: string;
  message: string;
  relatedReport?: string;
  relatedReportId?: string;
  relatedComplaint?: string;
  readAt?: string;
  createdAt: string;
}
