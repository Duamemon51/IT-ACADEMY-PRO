// types/index.ts

export interface IAdmin {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'superadmin';
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployee {
  _id: string;
  employeeId: string;       // Auto-generated: EMP-XXXX
  name: string;
  cnic: string;             // 13-digit CNIC
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  password: string;         // Hashed password
  plainPassword: string;    // Stored once for admin to view/share
  qrCode: string;           // Base64 QR code image
  qrToken: string;          // Unique token embedded in QR
  isActive: boolean;
  createdBy: string;        // Admin ID
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendance {
  _id: string;
  employeeId: string;
  employee: IEmployee;
  checkIn?: Date;
  checkOut?: Date;
  date: string;             // YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | 'half-day';
  location?: string;
  createdAt: Date;
}

export interface AdminAuthPayload {
  id: string;
  email: string;
  role: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
