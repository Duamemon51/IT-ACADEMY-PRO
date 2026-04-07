// models/Attendance.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendanceDocument extends Document {
  employeeId: mongoose.Types.ObjectId;
  checkIn?: Date;
  checkOut?: Date;
  date: string;
  status: 'present' | 'late' | 'half-day' | 'absent' | 'off';
  location?: string;
  qrTokenUsed: string;
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
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    date: {
      type: String,
      required: true, // Format: YYYY-MM-DD
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day','off'],
      default: 'present',
    },
    location: {
      type: String,
    },
    qrTokenUsed: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one record per employee per day
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance: Model<IAttendanceDocument> =
  mongoose.models.Attendance || mongoose.model<IAttendanceDocument>('Attendance', AttendanceSchema);

export default Attendance;
