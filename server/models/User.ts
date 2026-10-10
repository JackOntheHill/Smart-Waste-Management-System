import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'citizen' | 'worker' | 'admin';
  accountStatus: 'active' | 'pending' | 'suspended';
  profilePhoto?: string;
  workerDetails?: {
    employeeId?: string;
    assignedZone?: string;
    isAvailable?: boolean;
    vehicleType?: string;
    profilePhoto?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: 20,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ['citizen', 'worker', 'admin'],
      default: 'citizen',
    },
    accountStatus: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'active',
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    workerDetails: {
      employeeId: { type: String },
      assignedZone: { type: String, default: 'Central Municipal Ward' },
      isAvailable: { type: Boolean, default: true },
      vehicleType: { type: String, default: 'Light Tipper Truck' },
      profilePhoto: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
