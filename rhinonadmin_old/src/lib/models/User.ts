// lib/models/User.ts
import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  name: string;
  role: 'superadmin' | 'admin' | 'manager' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'manager', 'user'],
    default: 'user',
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);