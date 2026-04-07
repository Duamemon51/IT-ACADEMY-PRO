import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import jwt from 'jsonwebtoken';

// =====================
// GET — Admin: All employees attendance
// Query params: page, limit, date, employeeId, status
// =====================
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
    }

    jwt.verify(token, process.env.JWT_SECRET!); // admin token verify

    const { searchParams } = new URL(req.url);
    const page       = parseInt(searchParams.get('page')       || '1');
    const limit      = parseInt(searchParams.get('limit')      || '20');
    const dateParam  = searchParams.get('date')  || '';    // YYYY-MM-DD
    const monthParam = searchParams.get('month') || '';    // YYYY-MM
    const empFilter  = searchParams.get('employeeId') || '';
    const statusFilter = searchParams.get('status') || '';

    // Build attendance query
    const query: any = {};

    if (dateParam) {
      query.date = dateParam;
    } else if (monthParam) {
      const [y, m] = monthParam.split('-').map(Number);
      const start  = new Date(Date.UTC(y, m - 1, 1)).toISOString().split('T')[0];
      const end    = new Date(Date.UTC(y, m, 0)).toISOString().split('T')[0];
      query.date   = { $gte: start, $lte: end };
    } else {
      // Default: today in PKT
      const pkNow = new Date(new Date().getTime() + 5 * 60 * 60 * 1000);
      query.date  = pkNow.toISOString().split('T')[0];
    }

    if (empFilter)    query.employeeId = empFilter;
    if (statusFilter) query.status     = statusFilter;

    const total   = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .sort({ date: -1, checkIn: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Populate employee info
    const employeeIds = [...new Set(records.map((r: any) => r.employeeId))];
    const employees   = await Employee.find({ _id: { $in: employeeIds } })
      .select('name employeeId department designation')
      .lean();

    const empMap: Record<string, any> = {};
    employees.forEach((e: any) => { empMap[e._id.toString()] = e; });

    const enriched = records.map((rec: any) => ({
      ...rec,
      employee: empMap[rec.employeeId?.toString()] || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        records: enriched,
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