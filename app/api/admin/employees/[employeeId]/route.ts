import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import jwt from 'jsonwebtoken';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET!);

    const { employeeId } = await params;

    console.log('=== EMPLOYEE FETCH DEBUG ===');
    console.log('employeeId:', employeeId);
    console.log('employeeId type:', typeof employeeId);
    console.log('Model name:', Employee.modelName);
    console.log('Collection name:', Employee.collection.name);

    const employee = await Employee.findById(employeeId).lean();

    console.log('employee found:', employee ? 'YES' : 'NULL');
    console.log('===========================');

    if (!employee) {
      return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { employee },
    });
  } catch (err) {
    console.error('=== EMPLOYEE FETCH ERROR ===');
    console.error(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}