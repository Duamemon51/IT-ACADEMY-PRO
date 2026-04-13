import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';

// ─── PKT helpers ────────────────────────────────────────────────────────────
const pkNow  = () => new Date(Date.now() + 5 * 3600 * 1000);
const pkDate = () => pkNow().toISOString().split('T')[0];

function deriveStatus(checkInTime: Date): 'present' | 'late' {
  const pk   = new Date(checkInTime.getTime() + 5 * 3600 * 1000);
  const hour = pk.getUTCHours();
  const min  = pk.getUTCMinutes();
  return hour > 9 || (hour === 9 && min > 15) ? 'late' : 'present';
}

async function saveImage(imageBase64: string, employeeId: string): Promise<string> {
  const matches = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid image format.');

  const ext      = matches[1];
  const buffer   = Buffer.from(matches[2], 'base64');
  const filename = `${employeeId}-${Date.now()}.${ext}`;

  // ─── public/uploads/selfies use karo (process.cwd() se absolute path) ───
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'selfies');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/selfies/${filename}`;
}

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const { imageBase64, employeeId } = await req.json();

    if (!imageBase64 || !employeeId) {
      return NextResponse.json(
        { error: 'Selfie and employeeId are required.' },
        { status: 400 }
      );
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found.' },
        { status: 404 }
      );
    }

    const now   = new Date();
    const pk    = pkNow();
    const today = pkDate();

    // ── Weekend block ──
    const dayOfWeek = pk.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json(
        { error: 'Attendance cannot be marked on weekends.' },
        { status: 400 }
      );
    }

    const eightPMUtc = new Date(Date.UTC(
      pk.getUTCFullYear(), pk.getUTCMonth(), pk.getUTCDate(),
      15, 0, 0, 0
    ));

    const ipAddress  = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const deviceInfo = req.headers.get('user-agent') || '';

    const existing = await Attendance.findOne({ employeeId: employee._id, date: today });

    // ════════════════════════════════════════════
    //  CHECK-IN — no record for today
    // ════════════════════════════════════════════
    if (!existing) {
      if (now >= eightPMUtc) {
        return NextResponse.json(
          { error: 'Check-in is not allowed after 8:00 PM.' },
          { status: 400 }
        );
      }

      const selfieUrl = await saveImage(imageBase64, employeeId);
      const status    = deriveStatus(now);

      await Attendance.create({
        employeeId:       employee._id,
        checkIn:          now,
        date:             today,
        status,
        isLate:           status === 'late',
        qrTokenUsed:      'SELFIE_ATTENDANCE',
        selfieImage:      selfieUrl,
        selfieUploadedAt: now,
        attendanceMethod: 'selfie',
        ipAddress,
        deviceInfo,
      });

      return NextResponse.json({
        action:  'check-in',
        message: status === 'late'
          ? `${employee.name} — Checked in late.`
          : `${employee.name} — Checked in successfully!`,
        status,
      });
    }

    // ════════════════════════════════════════════
    //  CHECK-OUT — checked in but not checked out
    // ════════════════════════════════════════════
    if (!existing.checkOut) {
      const selfieUrl   = await saveImage(imageBase64, employeeId);
      const workedHours = (now.getTime() - new Date(existing.checkIn).getTime()) / 3_600_000;
      const isEarlyLeave = workedHours < 8;
      const newStatus   = isEarlyLeave ? 'half-day' : existing.status;

      await Attendance.findByIdAndUpdate(existing._id, {
        checkOut:         now,
        workingHours:     parseFloat(workedHours.toFixed(2)),
        isEarlyLeave,
        status:           newStatus,
        checkOutSelfie:   selfieUrl,
        selfieUploadedAt: now,
        attendanceMethod: 'selfie',
      });

      return NextResponse.json({
        action:       'check-out',
        message:      `${employee.name} — Checked out. Hours worked: ${workedHours.toFixed(2)}h`,
        workingHours: parseFloat(workedHours.toFixed(2)),
        isEarlyLeave,
      });
    }

    // ════════════════════════════════════════════
    //  ALREADY COMPLETE
    // ════════════════════════════════════════════
    return NextResponse.json(
      { error: 'Attendance already completed for today.' },
      { status: 409 }
    );

  } catch (error: any) {
    console.error('Selfie attendance error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}