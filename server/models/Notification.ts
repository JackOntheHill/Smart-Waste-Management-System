import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  type: 'report_status' | 'assignment' | 'completion' | 'complaint_update' | 'system';
  title: string;
  message: string;
  relatedReport?: Types.ObjectId;
  relatedReportId?: string;
  relatedComplaint?: Types.ObjectId;
  readAt?: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['report_status', 'assignment', 'completion', 'complaint_update', 'system'],
      default: 'system',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedReport: {
      type: Schema.Types.ObjectId,
      ref: 'Report',
    },
    relatedReportId: {
      type: String,
    },
    relatedComplaint: {
      type: Schema.Types.ObjectId,
      ref: 'Complaint',
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

NotificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
