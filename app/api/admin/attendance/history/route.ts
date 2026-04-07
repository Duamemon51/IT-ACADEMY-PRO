import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET!);

    const { searchParams } = new URL(req.url);
    const employeeId   = searchParams.get('employeeId') || '';
    const monthParam   = searchParams.get('month') || '';
    const statusFilter = searchParams.get('status') || '';
    const page         = parseInt(searchParams.get('page')  || '1');
    const limit        = parseInt(searchParams.get('limit') || '20');

    if (!employeeId) {
      return NextResponse.json({ success: false, message: 'employeeId required' }, { status: 400 });
    }

    // ✅ ObjectId conversion
    const empObjectId = mongoose.Types.ObjectId.isValid(employeeId)
      ? new mongoose.Types.ObjectId(employeeId)
      : employeeId;

    const nowUTC = new Date();
    const pkNow  = new Date(nowUTC.getTime() + 5 * 60 * 60 * 1000);

    let year: number, month: number;
    if (monthParam) {
      [year, month] = monthParam.split('-').map(Number);
      month -= 1;
    } else {
      year  = pkNow.getUTCFullYear();
      month = pkNow.getUTCMonth();
    }

    const startOfMonth = new Date(Date.UTC(year, month, 1));
    const endOfMonth   = new Date(Date.UTC(year, month + 1, 0));
    const totalDays    = endOfMonth.getUTCDate();

    const startStr = startOfMonth.toISOString().split('T')[0];
    const endStr   = endOfMonth.toISOString().split('T')[0];

    // ✅ Fixed query with ObjectId
    const dbRecords = await Attendance.find({
      employeeId: empObjectId,
      date: { $gte: startStr, $lte: endStr },
    }).lean();

    const attendanceMap: Record<string, any> = {};
    dbRecords.forEach((rec: any) => { attendanceMap[rec.date] = rec; });

    // PKT today string
    const pkTodayStr = pkNow.toISOString().split('T')[0];

    let finalData: any[] = [];

    for (let day = 1; day <= totalDays; day++) {
      const currentDate = new Date(Date.UTC(year, month, day));
      const date        = currentDate.toISOString().split('T')[0];

      // ✅ Skip future dates
      if (date > pkTodayStr) continue;

      const dayOfWeek = currentDate.getUTCDay();

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        finalData.push({ date, status: 'off' });
      } else if (attendanceMap[date]) {
        finalData.push(attendanceMap[date]);
      } else {
        finalData.push({ date, status: 'absent' });
      }
    }

    // ✅ Filter BEFORE pagination
    if (statusFilter) {
      finalData = finalData.filter(r => r.status === statusFilter);
    }

    // ✅ Sort descending (newest first)
    finalData.sort((a, b) => (a.date > b.date ? -1 : 1));

    const total         = finalData.length;
    const paginatedData = finalData.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: {
        records: paginatedData,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}