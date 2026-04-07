// app/api/employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import '@/models/Admin'; // populate ke liye zaroori hai
import { getAdminFromRequest } from '@/lib/authMiddleware';
import {
  generateEmployeeId,
  generatePassword,
  generateQRToken,
  validateCNIC,
  formatCNIC,
} from '@/lib/helpers';
import QRCode from 'qrcode';

// GET all employees
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

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    if (isActive !== null && isActive !== '') query.isActive = isActive === 'true';

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

// POST create employee
export async function POST(req: NextRequest) {
  try {
    const adminPayload = getAdminFromRequest(req);
    if (!adminPayload) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { name, cnic, email, phone, department, designation } = body;

    // Validation
    if (!name || !cnic || !email) {
      return NextResponse.json(
        { success: false, message: 'Naam, CNIC aur email zaroori hain' },
        { status: 400 }
      );
    }

    if (!validateCNIC(cnic)) {
      return NextResponse.json(
        { success: false, message: 'CNIC galat hai. 13 digits hone chahiye' },
        { status: 400 }
      );
    }

    // Check duplicates
    const formattedCNIC = formatCNIC(cnic);
    const existing = await Employee.findOne({
      $or: [{ email: email.toLowerCase() }, { cnic: formattedCNIC }],
    });

    if (existing) {
      const field = existing.email === email.toLowerCase() ? 'Email' : 'CNIC';
      return NextResponse.json(
        { success: false, message: `${field} pehle se registered hai` },
        { status: 409 }
      );
    }

    // Generate unique employee ID
    let employeeId = generateEmployeeId();
    let idExists = await Employee.findOne({ employeeId });
    while (idExists) {
      employeeId = generateEmployeeId();
      idExists = await Employee.findOne({ employeeId });
    }

    // Generate password
    const plainPassword = generatePassword();

    // Generate QR Token
    const qrToken = generateQRToken();

    // QR code data payload
    const qrData = JSON.stringify({
      employeeId,
      qrToken,
      name,
      timestamp: Date.now(),
    });

    // Generate QR Code as base64 image
    const qrCode = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
    });

    // Create employee
    const employee = await Employee.create({
      employeeId,
      name: name.trim(),
      cnic: formattedCNIC,
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      department: department?.trim(),
      designation: designation?.trim(),
      password: plainPassword,
      plainPassword,
      qrCode,
      qrToken,
      isActive: true,
      createdBy: adminPayload.id,
    });

    // Return employee without hashed password but with plain
    const employeeData = employee.toObject();

    return NextResponse.json(
      {
        success: true,
        message: `Employee ${name} kamiyabi se add ho gaya`,
        data: {
          employee: {
            ...employeeData,
            password: undefined, // hide hashed
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
