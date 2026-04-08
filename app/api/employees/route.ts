import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import '@/models/Admin';
import { getAdminFromRequest } from '@/lib/authMiddleware';
import {
  generateEmployeeId,
  generatePassword,
  generateQRToken,
  validateCNIC,
  formatCNIC,
} from '@/lib/helpers';
import QRCode from 'qrcode';

//
// 📁 SAVE IMAGE TO PUBLIC FOLDER
//
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

async function saveImage(base64: string, fileName: string) {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  // ✅ Create folder if not exists
  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  return `/uploads/${fileName}`;
}
//
// GET ALL EMPLOYEES
//
export async function GET(req: NextRequest) {
  try {
    const adminPayload = getAdminFromRequest(req);
    if (!adminPayload) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const isActive = searchParams.get('isActive');

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
      ];
    }

    if (department) query.department = department;
    if (isActive !== null && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;

    const total = await Employee.countDocuments(query);

    const employees = await Employee.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      data: {
        employees,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get employees error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

//
// POST CREATE EMPLOYEE
//
export async function POST(req: NextRequest) {
  try {
    const adminPayload = getAdminFromRequest(req);
    if (!adminPayload) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();

    const {
      name,
      cnic,
      email,
      phone,
      alternatePhone,
      department,
      designation,
      companyEmail,

      cnicFrontImage,
      cnicBackImage,

      bankAccountNo,
      bankAccountTitle,

      joiningDate,

      basicPay,
      adjustment,
      deduction,
    } = body;

    // ✅ Validation
    if (!name || !cnic || !email) {
      return NextResponse.json(
        { success: false, message: 'Name, CNIC aur email required hain' },
        { status: 400 }
      );
    }

    if (!validateCNIC(cnic)) {
      return NextResponse.json(
        { success: false, message: 'CNIC must be 13 digits' },
        { status: 400 }
      );
    }

    const formattedCNIC = formatCNIC(cnic);

    // ✅ Check duplicates
    const existing = await Employee.findOne({
      $or: [{ email: email.toLowerCase() }, { cnic: formattedCNIC }],
    });

    if (existing) {
      const field = existing.email === email.toLowerCase() ? 'Email' : 'CNIC';
      return NextResponse.json(
        { success: false, message: `${field} already exists` },
        { status: 409 }
      );
    }

    // ✅ Employee ID
    let employeeId = generateEmployeeId();
    while (await Employee.findOne({ employeeId })) {
      employeeId = generateEmployeeId();
    }

    // ✅ Password & QR
    const plainPassword = generatePassword();
    const qrToken = generateQRToken();

    const qrData = JSON.stringify({
      employeeId,
      qrToken,
      name,
      timestamp: Date.now(),
    });

    const qrCode = await QRCode.toDataURL(qrData);

    // ✅ Save Images
    let frontImagePath = '';
    let backImagePath = '';

    if (cnicFrontImage) {
      frontImagePath = await saveImage(
        cnicFrontImage,
        `cnic_front_${Date.now()}.png`
      );
    }

    if (cnicBackImage) {
      backImagePath = await saveImage(
        cnicBackImage,
        `cnic_back_${Date.now()}.png`
      );
    }

    // ✅ Create Employee
    const employee = await Employee.create({
      employeeId,
      name: name.trim(),
      cnic: formattedCNIC,
      email: email.toLowerCase().trim(),

      phone: phone?.trim(),
      alternatePhone: alternatePhone?.trim(),

      department: department?.trim(),
      designation: designation?.trim(),

      companyEmail: companyEmail?.toLowerCase()?.trim(),

      cnicFrontImage: frontImagePath,
      cnicBackImage: backImagePath,

      bankAccountNo: bankAccountNo?.trim(),
      bankAccountTitle: bankAccountTitle?.trim(),

      joiningDate: joiningDate ? new Date(joiningDate) : undefined,

      basicPay: basicPay || 0,
      adjustment: adjustment || 0,
      deduction: deduction || 0,

      password: plainPassword,
      plainPassword,

      qrCode,
      qrToken,

      isActive: true,
      createdBy: adminPayload.id,
    });

    const employeeData = employee.toObject();

    return NextResponse.json(
      {
        success: true,
        message: `Employee ${name} successfully created`,
        data: {
          employee: {
            ...employeeData,
            password: undefined,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}