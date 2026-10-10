import mongoose, { Schema, Document, Types } from 'mongoose';

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

export interface IAuditEntry {
  action: string;
  changedBy: Types.ObjectId;
  changerName: string;
  changerRole: string;
  previousStatus?: ReportStatus;
  newStatus?: ReportStatus;
  explanation: string;
  timestamp: Date;
}

export interface ICompletionEvidence {
  collectionImages: string[];
  workerVerificationImage: string;
  completionNotes?: string;
  wasteQuantityEstimate?: string;
  submittedAt: Date;
  serverRecordedAt: Date;
  worker: Types.ObjectId;
}

export interface ICitizenFeedback {
  rating: number;
  satisfied: boolean;
  comment?: string;
  submittedAt: Date;
}

export interface IReport extends Document {
  reportId: string;
  title: string;
  description: string;
  wasteType: WasteType;
  customWasteType?: string;
  locationAddress: string;
  locationCoordinates: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  locationMethod: 'automatic_gps' | 'manual_map' | 'manual_address';
  images: string[];
  reporterPhone: string;
  reportedBy: Types.ObjectId;
  assignedWorker?: Types.ObjectId;
  status: ReportStatus;
  priority: ReportPriority;
  startedAt?: Date;
  resolvedAt?: Date;
  completionEvidence?: ICompletionEvidence;
  citizenFeedback?: ICitizenFeedback;
  auditHistory: IAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const AuditEntrySchema = new Schema<IAuditEntry>(
  {
    action: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changerName: { type: String, required: true },
    changerRole: { type: String, required: true },
    previousStatus: { type: String },
    newStatus: { type: String },
    explanation: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CompletionEvidenceSchema = new Schema<ICompletionEvidence>(
  {
    collectionImages: {
      type: [String],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length >= 3,
        message: 'At least three distinct collection photographs are required',
      },
    },
    workerVerificationImage: { type: String, required: true },
    completionNotes: { type: String, default: '' },
    wasteQuantityEstimate: { type: String, default: 'Standard Bin (approx 100-200kg)' },
    submittedAt: { type: Date, required: true },
    serverRecordedAt: { type: Date, default: Date.now },
    worker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
);

const CitizenFeedbackSchema = new Schema<ICitizenFeedback>(
  {
    rating: { type: Number, min: 1, max: 5, required: true },
    satisfied: { type: Boolean, required: true },
    comment: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ReportSchema = new Schema<IReport>(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    wasteType: {
      type: String,
      required: true,
      enum: [
        'Household / General Waste',
        'Plastic Waste',
        'Organic Waste',
        'Electronic Waste',
        'Construction Debris',
        'Medical or Hazardous Waste',
        'Mixed Waste',
        'Other',
      ],
    },
    customWasteType: {
      type: String,
    },
    locationAddress: {
      type: String,
      required: true,
    },
    locationCoordinates: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    locationMethod: {
      type: String,
      enum: ['automatic_gps', 'manual_map', 'manual_address'],
      default: 'automatic_gps',
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length >= 3,
        message: 'A minimum of three distinct photographs is required for report submission',
      },
    },
    reporterPhone: {
      type: String,
      required: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedWorker: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'Pending',
        'Assigned',
        'In Progress',
        'Resolved',
        'Rejected',
        'Requires Clarification',
        'Reopened',
      ],
      default: 'Pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
      index: true,
    },
    startedAt: { type: Date },
    resolvedAt: { type: Date },
    completionEvidence: { type: CompletionEvidenceSchema },
    citizenFeedback: { type: CitizenFeedbackSchema },
    auditHistory: [AuditEntrySchema],
  },
  {
    timestamps: true,
  }
);

// Geospatial 2dsphere index for nearby worker queries
ReportSchema.index({ locationCoordinates: '2dsphere' });
ReportSchema.index({ status: 1, createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);
