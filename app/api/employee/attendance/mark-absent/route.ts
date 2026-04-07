import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';

export async function GET() {
  try {
    await connectDB();

    const today = new Date().toISOString().split('T')[0];

    const employees = await Employee.find();

    for (const emp of employees) {
      const attendance = await Attendance.findOne({
        employeeId: emp._id,
        date: today,
      });

      // 👉 ONLY absent if no check-in
      if (!attendance) {
        await Attendance.create({
          employeeId: emp._id,
          date: today,
          status: 'absent',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Absent marked successfully',
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}