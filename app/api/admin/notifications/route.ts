// app/api/admin/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import Ticket from '@/models/Ticket';
import jwt from 'jsonwebtoken';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: 'checkin' | 'checkout' | 'ticket' | 'absent' | 'report';
  text: string;
  time: string;
  timestamp: string;
  unread: boolean;
  meta?: Record<string, unknown>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(date: Date): string {
  const diffMs  = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr  < 24) return `${diffHr} hr ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

/** Format a Date to HH:MM AM/PM in PKT */
function formatTimePKT(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour:     '2-digit',
    minute:   '2-digit',
    timeZone: 'Asia/Karachi',
  });
}

/** Today's date string in PKT as YYYY-MM-DD */
function todayPKT(): string {
  return new Date(Date.now() + 5 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // ── Auth ────────────────────────────────────────────────────────────────
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // ── Query params ────────────────────────────────────────────────────────
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // ── Date windows ────────────────────────────────────────────────────────
    const today     = todayPKT();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // ── 1. Fetch all today's attendance records (present + late) ────────────
    //
    // FIX: 'late' status wale bhi present hote hain — unhe bhi include karo.
    // FIX: checkout ke liye alag query ki zaroorat nahi — same records mein
    //      checkOut field hota hai. Ek hi query mein dono mil jaate hain.
    //
    const todayRecords = await Attendance.find({
      date:   today,
      status: { $in: ['present', 'late'] },   // ← late bhi include
    })
      .sort({ checkIn: -1 })
      .limit(30)                               // extra fetch, slice baad mein
      .lean();

    // ── 2. Resolve employee names in one query ──────────────────────────────
    const empIds = [...new Set(todayRecords.map((r: any) => r.employeeId?.toString()))];

    const employees = await Employee.find({ _id: { $in: empIds } })
      .select('name')
      .lean();

    const empNameMap: Record<string, string> = {};
    employees.forEach((e: any) => {
      empNameMap[e._id.toString()] = e.name;
    });

    // ── 3. Build check-IN notifications ────────────────────────────────────
    const checkinNotifs: Notification[] = todayRecords
      .filter((r: any) => r.checkIn)           // checkIn field must exist
      .map((r: any) => {
        const empName = empNameMap[r.employeeId?.toString()] || 'An employee';
        const checkIn = new Date(r.checkIn);
        const lateTag = r.isLate ? ' (late)' : '';

        return {
          id:        `checkin-${r._id}`,
          type:      'checkin' as const,
          text:      `${empName} checked in at ${formatTimePKT(checkIn)}${lateTag}`,
          time:      relativeTime(checkIn),
          timestamp: checkIn.toISOString(),
          unread:    true,
          meta: {
            attendanceId: r._id.toString(),
            employeeId:   r.employeeId?.toString(),
            isLate:       r.isLate ?? false,
          },
        };
      });

    // ── 4. Build check-OUT notifications ───────────────────────────────────
    //
    // Only records that have a checkOut value AND checkOut happened today
    //
    const checkoutNotifs: Notification[] = todayRecords
      .filter((r: any) => r.checkOut)          // checkOut field must exist
      .map((r: any) => {
        const empName  = empNameMap[r.employeeId?.toString()] || 'An employee';
        const checkOut = new Date(r.checkOut);
        const earlyTag = r.isEarlyLeave ? ' (early)' : '';
        const hoursTag = r.workingHours
          ? ` · ${r.workingHours.toFixed(1)}h worked`
          : '';

        return {
          id:        `checkout-${r._id}`,
          type:      'checkout' as const,
          text:      `${empName} checked out at ${formatTimePKT(checkOut)}${earlyTag}${hoursTag}`,
          time:      relativeTime(checkOut),
          timestamp: checkOut.toISOString(),
          unread:    true,
          meta: {
            attendanceId: r._id.toString(),
            employeeId:   r.employeeId?.toString(),
            workingHours: r.workingHours,
            isEarlyLeave: r.isEarlyLeave ?? false,
          },
        };
      });

    // ── 5. Absent notification (summary) ───────────────────────────────────
    const absentCount = await Attendance.countDocuments({
      date:   today,
      status: 'absent',
    });

    const absentNotifs: Notification[] = absentCount > 0 ? [{
      id:        `absent-${today}`,
      type:      'absent' as const,
      text:      `${absentCount} employee${absentCount !== 1 ? 's' : ''} marked absent today`,
      time:      'Today',
      timestamp: new Date(`${today}T00:01:00Z`).toISOString(),
      unread:    true,
      meta:      { count: absentCount, date: today },
    }] : [];

    // ── 6. New tickets (last 24 h) ──────────────────────────────────────────
    const recentTickets = await Ticket.find({ createdAt: { $gte: oneDayAgo } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('employeeId', 'name')
      .lean();

    const ticketNotifs: Notification[] = recentTickets.map((t: any) => {
      const empName = t.employeeId?.name || 'An employee';
      const created = new Date(t.createdAt);

      return {
        id:        `ticket-${t._id}`,
        type:      'ticket' as const,
        text:      `New support ticket from ${empName}`,
        time:      relativeTime(created),
        timestamp: created.toISOString(),
        unread:    true,
        meta:      { ticketId: t._id.toString(), subject: t.subject },
      };
    });

    // ── 7. Merge, sort, slice ───────────────────────────────────────────────
    const all: Notification[] = [
      ...checkinNotifs,
      ...checkoutNotifs,
      ...absentNotifs,
      ...ticketNotifs,
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        notifications: all,
        unreadCount:   all.filter(n => n.unread).length,
        total:         all.length,
      },
    });

  } catch (err) {
    console.error('ADMIN NOTIFICATIONS ERROR:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// ─── PATCH — mark notifications read ─────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
    }
    jwt.verify(token, process.env.JWT_SECRET!);

    return NextResponse.json({ success: true, message: 'Marked as read' });
  } catch {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}