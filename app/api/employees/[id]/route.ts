// app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { getAdminFromRequest } from '@/lib/authMiddleware';
import { validateCNIC, formatCNIC } from '@/lib/helpers';

// GET single employee
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminPayload = getAdminFromRequest(req);
    if (!adminPayload) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const employee = await Employee.findById(id)
      .select('-password')
      .populate('createdBy', 'name email');

    if (!employee) {
      return NextResponse.json({ success: false, message: 'Employee nahi mila' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { employee } });
  } catch (error) {
    console.error('Get employee error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// PUT update employee
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminPayload = getAdminFromRequest(req);
    if (!adminPayload) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { name, cnic, email, phone, department, designation, isActive } = body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ success: false, message: 'Employee nahi mila' }, { status: 404 });
    }

    // Check CNIC if changed
    if (cnic && cnic !== employee.cnic) {
      if (!validateCNIC(cnic)) {
        return NextResponse.json(
          { success: false, message: 'CNIC galat hai' },
          { status: 400 }
        );
      }
      const formattedCNIC = formatCNIC(cnic);
      const cnicExists = await Employee.findOne({ cnic: formattedCNIC, _id: { $ne: id } });
      if (cnicExists) {
        return NextResponse.json(
          { success: false, message: 'Yeh CNIC pehle se registered hai' },
          { status: 409 }
        );
      }
      employee.cnic = formattedCNIC;
    }

    // Check email if changed
    if (email && email !== employee.email) {
      const emailExists = await Employee.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (emailExists) {
        return NextResponse.json(
          { success: false, message: 'Yeh email pehle se registered hai' },
          { status: 409 }
        );
      }
      employee.email = email.toLowerCase();
    }

    if (name) employee.name = name.trim();
    if (phone !== undefined) employee.phone = phone?.trim();
    if (department !== undefined) employee.department = department?.trim();
    if (designation !== undefined) employee.designation = designation?.trim();
    if (isActive !== undefined) employee.isActive = isActive;

    await employee.save();

    return NextResponse.json({
      success: true,
      message: 'Employee details update ho gaye',
      data: { employee },
    });
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// DELETE employee
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminPayload = getAdminFromRequest(req);
    if (!adminPayload) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return NextResponse.json({ success: false, message: 'Employee nahi mila' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Employee ${employee.name} delete ho gaya`,
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
