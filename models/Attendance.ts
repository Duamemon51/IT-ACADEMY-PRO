// models/Attendance.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendanceDocument extends Document {
  employeeId: mongoose.Types.ObjectId;

  checkIn?: Date;
  checkOut?: Date;

  date: string;

  status: 'present' | 'late' | 'half-day' | 'absent' | 'off';

  // 📍 Location (GPS)
  latitude?: number;
  longitude?: number;
  location?: string;

  // 🌐 Network & Device
  ipAddress?: string;
  deviceInfo?: string;

  // 🔐 QR Tracking (❌ expiry removed)
  qrTokenUsed: string;

  // ⏱️ Work Tracking
  workingHours?: number;
  isLate?: boolean;
  isEarlyLeave?: boolean;

  // 📍 Validation
  isWithinOffice?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendanceDocument>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    checkIn: Date,
    checkOut: Date,

    date: {
      type: String,
      required: true, // YYYY-MM-DD
    },

    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'off'],
      default: 'present',
    },

    // 📍 GPS
    latitude: Number,
    longitude: Number,
    location: String,

    // 🌐 Network
    ipAddress: String,
    deviceInfo: String,

    // 🔐 QR (expiry removed)
    qrTokenUsed: {
      type: String,
      required: true,
    },

    // ⏱️ Work
    workingHours: Number,
    isLate: {
      type: Boolean,
      default: false,
    },
    isEarlyLeave: {
      type: Boolean,
      default: false,
    },

    // 📍 Validation
    isWithinOffice: Boolean,
  },
  {
    timestamps: true,
  }
);

// ✅ One record per employee per day
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance: Model<IAttendanceDocument> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendanceDocument>('Attendance', AttendanceSchema);

export default Attendance;