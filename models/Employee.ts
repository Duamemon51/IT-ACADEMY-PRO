import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IEmployeeDocument extends Document {
  employeeId: string;
  name: string;
  cnic: string;
  cnicFrontImage?: string;
  cnicBackImage?: string;

  email: string;
  companyEmail?: string;

  phone?: string;
  alternatePhone?: string;

  department?: string;
  designation?: string;

  password: string;
  plainPassword: string;

  qrCode: string;
  qrToken: string;

  // 🏦 Bank Details
  bankAccountNo?: string;
  bankAccountTitle?: string;

  // 📅 Employment
  joiningDate?: Date;

  // 💰 Salary
  basicPay?: number;
  adjustment?: number;
  deduction?: number;

  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const EmployeeSchema = new Schema<IEmployeeDocument>(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
    },

    cnic: {
      type: String,
      required: [true, 'CNIC is required'],
      unique: true,
      trim: true,
      index: true,
      sparse: true,
    },

    // 🪪 CNIC Images
    cnicFrontImage: { type: String, trim: true },
    cnicBackImage: { type: String, trim: true },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      sparse: true,
    },

    // 🏢 Company Email
    companyEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },

    phone: { type: String, trim: true },

    // 📞 Alternate Number
    alternatePhone: { type: String, trim: true },

    department: { type: String, trim: true },
    designation: { type: String, trim: true },

    password: { type: String, required: true },
    plainPassword: { type: String, required: true },

    qrCode: { type: String, required: true },
    qrToken: { type: String, required: true, unique: true, index: true },

    // 🏦 Bank Details
    bankAccountNo: { type: String, trim: true },
    bankAccountTitle: { type: String, trim: true },

    // 📅 Joining Date
    joiningDate: { type: Date },

    // 💰 Salary Structure
    basicPay: { type: Number, default: 0 },
    adjustment: { type: Number, default: 0 },
    deduction: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  { timestamps: true }
);

//
// 🔐 HASH PASSWORD
//
EmployeeSchema.pre('save', async function (this: IEmployeeDocument) {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

//
// 🔑 COMPARE PASSWORD
//
EmployeeSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

//
// ⚡ MODEL FIX
//
const Employee: Model<IEmployeeDocument> =
  mongoose.models.Employee ||
  mongoose.model<IEmployeeDocument>('Employee', EmployeeSchema);

export default Employee;