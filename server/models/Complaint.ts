import mongoose, { Schema, Document, Types } from 'mongoose';

export type ComplaintCategory =
  // Citizen categories:
  | 'Garbage not collected within expected timeframe'
  | 'Report incorrectly marked as resolved'
  | 'Garbage only partially removed'
  | 'Incorrect collection or handling'
  | 'Worker conduct or service quality'
  | 'Incorrect status update'
  // Worker categories:
  | 'Incorrect waste type'
  | 'Incorrect or inaccessible location'
  | 'Duplicate report'
  | 'Garbage already removed'
  | 'Hazardous waste incorrectly categorized'
  | 'Insufficient or misleading images'
  | 'Unsafe collection conditions'
  | 'Reporter-provided information is inaccurate'
  | 'Other';

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Action Required'
  | 'Resolved'
  | 'Rejected';

export interface IComplaint extends Document {
  complaintId: string;
  report: Types.ObjectId;
  reportId: string;
  submittedBy: Types.ObjectId;
  submittedByName: string;
  submittedByRole: 'citizen' | 'worker';
  category: ComplaintCategory;
  description: string;
  supportingImages: string[];
  status: ComplaintStatus;
  resolutionNotes?: string;
  reviewedBy?: Types.ObjectId;
  reviewedByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    report: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },
    reportId: {
      type: String,
      required: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    submittedByName: {
      type: String,
      required: true,
    },
    submittedByRole: {
      type: String,
      enum: ['citizen', 'worker'],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide an explanation for this complaint'],
      minlength: 10,
    },
    supportingImages: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Action Required', 'Resolved', 'Rejected'],
      default: 'Submitted',
      index: true,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedByName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
