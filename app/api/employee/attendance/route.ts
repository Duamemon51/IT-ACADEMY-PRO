import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import jwt from 'jsonwebtoken';

// =====================
// GET ATTENDANCE
// =====================
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token' },
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const employeeId = decoded.id;

    const { searchParams } = new URL(req.url);
    const page  = parseInt(searchParams.get('page')  || '1');
    const limit = parseInt(searchParams.get('limit') || '15');

    // Current time in PKT (UTC+5)
    const nowUTC  = new Date();
    const pkNow   = new Date(nowUTC.getTime() + 5 * 60 * 60 * 1000);
    const pkToday = pkNow.toISOString().split('T')[0];

    const year  = pkNow.getUTCFullYear();
    const month = pkNow.getUTCMonth();

    const startOfMonth = new Date(Date.UTC(year, month, 1));
    const endOfMonth   = new Date(Date.UTC(year, month + 1, 0));
    const totalDays    = endOfMonth.getUTCDate();

    const startStr = startOfMonth.toISOString().split('T')[0];
    const endStr   = endOfMonth.toISOString().split('T')[0];

    // Fetch DB records for this month
    const records = await Attendance.find({
      employeeId,
      date: { $gte: startStr, $lte: endStr },
    }).sort({ date: -1 });

    // =====================
    // AUTO CHECKOUT LOGIC
    // Triggers if:
    //   - past day:  checkIn exists, checkOut missing
    //   - today:     checkIn exists, checkOut missing, AND current PKT time >= 8:00 PM
    // Auto checkOut = 8:00 PM PKT (15:00 UTC) of that day
    // =====================

    // Has 8:00 PM PKT passed today?
    const eightPMTodayUTC = new Date(Date.UTC(year, month, pkNow.getUTCDate(), 15, 0, 0, 0));
    const isPast8PMToday  = nowUTC >= eightPMTodayUTC;

    const autoCheckoutPromises: Promise<any>[] = [];

    for (const rec of records) {
      const isPastDay = rec.date < pkToday;
      const isToday   = rec.date === pkToday;

      const shouldAutoCheckout =
        rec.checkIn &&
        !rec.checkOut &&
        (isPastDay || (isToday && isPast8PMToday));

      if (shouldAutoCheckout) {
        // Auto checkOut = 8:00 PM PKT of that specific day
        const [recYear, recMonth, recDay] = rec.date.split('-').map(Number);
        const autoCheckoutUTC = new Date(Date.UTC(recYear, recMonth - 1, recDay, 15, 0, 0, 0));

        const diff        = autoCheckoutUTC.getTime() - new Date(rec.checkIn).getTime();
        const workedHours = diff / (1000 * 60 * 60);

        rec.checkOut = autoCheckoutUTC;

        if (workedHours < 8) {
          rec.status = 'half-day';
        }
        // else: keep existing 'present' or 'late'

        autoCheckoutPromises.push(rec.save());
      }
    }

    if (autoCheckoutPromises.length > 0) {
      await Promise.all(autoCheckoutPromises);
    }

    // Map by date string (after saves)
    const attendanceMap: Record<string, any> = {};
    records.forEach((rec: any) => {
      attendanceMap[rec.date] = rec;
    });

    // Build full month
    const finalData: any[] = [];

    for (let day = 1; day <= totalDays; day++) {
      const currentDate = new Date(Date.UTC(year, month, day));
      const date        = currentDate.toISOString().split('T')[0];
      const dayOfWeek   = currentDate.getUTCDay(); // 0=Sun, 6=Sat

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        finalData.push({ employeeId, date, status: 'off' });
      } else if (attendanceMap[date]) {
        finalData.push(attendanceMap[date]);
      } else {
        finalData.push({ employeeId, date, status: 'absent' });
      }
    }

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
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// =====================
// POST ATTENDANCE
// =====================
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token' },
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const employeeId = decoded.id;

    const { location } = await req.json();

    const nowUTC    = new Date();
    const pkNow     = new Date(nowUTC.getTime() + 5 * 60 * 60 * 1000);
    const today     = pkNow.toISOString().split('T')[0];
    const dayOfWeek = pkNow.getUTCDay();

    // Block weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json(
        { success: false, message: 'Cannot mark attendance on weekends' },
        { status: 400 }
      );
    }

    // Block check-in after 8 PM PKT (15:00 UTC)
    const eightPMTodayUTC = new Date(Date.UTC(
      pkNow.getUTCFullYear(),
      pkNow.getUTCMonth(),
      pkNow.getUTCDate(),
      15, 0, 0, 0
    ));

    const employee = await Employee.findById(employeeId).select('qrToken');
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    let attendance = await Attendance.findOne({ employeeId, date: today });

    // =====================
    // CHECK-IN
    // =====================
    if (!attendance) {
      // Block new check-in after 8 PM PKT
      if (nowUTC >= eightPMTodayUTC) {
        return NextResponse.json(
          { success: false, message: 'Check-in not allowed after 8:00 PM' },
          { status: 400 }
        );
      }

      // Late if after 10:45 AM PKT (05:45 UTC)
      const lateThresholdUTC = new Date(Date.UTC(
        pkNow.getUTCFullYear(),
        pkNow.getUTCMonth(),
        pkNow.getUTCDate(),
        5, 45, 0, 0
      ));

      const status: 'present' | 'late' = nowUTC > lateThresholdUTC ? 'late' : 'present';

      attendance = await Attendance.create({
        employeeId,
        checkIn: nowUTC,
        date: today,
        status,
        location: location || '',
        qrTokenUsed: employee.qrToken,
      });

      return NextResponse.json({
        success: true,
        message: 'Check-in marked',
        data: attendance,
      });
    }

    // =====================
    // CHECK-OUT
    // =====================
    if (!attendance.checkOut) {
      // If already auto-checked-out by system, block manual checkout
      attendance.checkOut = nowUTC;

      const diff        = nowUTC.getTime() - new Date(attendance.checkIn).getTime();
      const workedHours = diff / (1000 * 60 * 60);

      if (workedHours < 8) {
        attendance.status = 'half-day';
      }

      await attendance.save();

      return NextResponse.json({
        success: true,
        message: 'Check-out marked',
        data: attendance,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Already marked today' },
      { status: 400 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}