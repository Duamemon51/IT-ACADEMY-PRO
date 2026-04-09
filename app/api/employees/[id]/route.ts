import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { getAdminFromRequest } from '@/lib/authMiddleware';
import { validateCNIC, formatCNIC } from '@/lib/helpers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

//
// 📁 SAVE IMAGE
//
async function saveImage(base64: string, fileName: string) {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);

  return `/uploads/${fileName}`;
}

//
// ✅ GET SINGLE EMPLOYEE
//
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminPayload = getAdminFromRequest(req);
    if (!adminPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    // Exclude only the hashed password; keep plainPassword for admin view
    const employee = await Employee.findById(id)
      .select('-password')
      .populate('createdBy', 'name email');

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee nahi mila' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { employee },
    });
  } catch (error) {
    console.error('Get employee error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

//
// ✅ UPDATE EMPLOYEE (with password support)
//
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminPayload = getAdminFromRequest(req);
    if (!adminPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const body = await req.json();

    // Fetch with password field so we can update it
    const employee = await Employee.findById(id).select('+password');

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee nahi mila' },
        { status: 404 }
      );
    }

    const {
      name,
      cnic,
      email,
      phone,
      alternatePhone,
      department,
      designation,
      companyEmail,
      isActive,
      bankAccountNo,
      bankAccountTitle,
      joiningDate,
      basicPay,
      adjustment,
      deduction,
      cnicFrontImage,
      cnicBackImage,
      // 🔑 New password fields
      newPassword,
    } = body;

    // ── CNIC ─────────────────────────────────────────────────────────────────
    if (cnic && cnic !== employee.cnic) {
      if (!validateCNIC(cnic)) {
        return NextResponse.json(
          { success: false, message: 'CNIC invalid hai' },
          { status: 400 }
        );
      }

      const formattedCNIC = formatCNIC(cnic);

      const exists = await Employee.findOne({
        cnic: formattedCNIC,
        _id: { $ne: employee._id },
      });

      if (exists) {
        return NextResponse.json(
          { success: false, message: 'CNIC already exists' },
          { status: 409 }
        );
      }

      employee.cnic = formattedCNIC;
    }

    // ── EMAIL ────────────────────────────────────────────────────────────────
    if (email && email !== employee.email) {
      const lowerEmail = email.toLowerCase();

      const exists = await Employee.findOne({
        email: lowerEmail,
        _id: { $ne: employee._id },
      });

      if (exists) {
        return NextResponse.json(
          { success: false, message: 'Email already exists' },
          { status: 409 }
        );
      }

      employee.email = lowerEmail;
    }

    // ── PASSWORD ─────────────────────────────────────────────────────────────
    // Admin sets a new plain-text password; pre-save hook will hash it
    if (newPassword && newPassword.trim().length >= 6) {
      employee.password = newPassword.trim();      // will be hashed by pre-save
      employee.plainPassword = newPassword.trim(); // store raw for admin reference
    }

    // ── TEXT FIELDS ──────────────────────────────────────────────────────────
    if (name) employee.name = name.trim();
    if (phone !== undefined) employee.phone = phone?.trim();
    if (alternatePhone !== undefined) employee.alternatePhone = alternatePhone?.trim();
    if (department !== undefined) employee.department = department?.trim();
    if (designation !== undefined) employee.designation = designation?.trim();
    if (companyEmail !== undefined) {
      employee.companyEmail = companyEmail?.toLowerCase()?.trim();
    }

    // ── BANK ─────────────────────────────────────────────────────────────────
    if (bankAccountNo !== undefined) employee.bankAccountNo = bankAccountNo?.trim();
    if (bankAccountTitle !== undefined) employee.bankAccountTitle = bankAccountTitle?.trim();

    // ── DATE ─────────────────────────────────────────────────────────────────
    if (joiningDate) employee.joiningDate = new Date(joiningDate);

    // ── SALARY ───────────────────────────────────────────────────────────────
    if (basicPay !== undefined) employee.basicPay = basicPay;
    if (adjustment !== undefined) employee.adjustment = adjustment;
    if (deduction !== undefined) employee.deduction = deduction;

    // ── STATUS ───────────────────────────────────────────────────────────────
    if (isActive !== undefined) employee.isActive = isActive;

    // ── IMAGES ───────────────────────────────────────────────────────────────
    if (cnicFrontImage) {
      employee.cnicFrontImage = await saveImage(
        cnicFrontImage,
        `cnic_front_${Date.now()}.png`
      );
    }

    if (cnicBackImage) {
      employee.cnicBackImage = await saveImage(
        cnicBackImage,
        `cnic_back_${Date.now()}.png`
      );
    }

    await employee.save();

    // Return without hashed password
   const updated = employee.toObject();
delete (updated as any).password;

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      data: { employee: updated },
    });
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

//
// ✅ DELETE EMPLOYEE
//
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminPayload = getAdminFromRequest(req);
    if (!adminPayload) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee nahi mila' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Employee ${employee.name} deleted`,
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}