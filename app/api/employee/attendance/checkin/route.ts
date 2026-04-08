import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import jwt from 'jsonwebtoken';

// ─── Haversine distance (meters) ───────────────────────────────────────────
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Office anchor (from env) ───────────────────────────────────────────────
const OFFICE_LAT    = parseFloat(process.env.OFFICE_LATITUDE!);
const OFFICE_LNG    = parseFloat(process.env.OFFICE_LONGITUDE!);
const OFFICE_RADIUS = parseFloat(process.env.OFFICE_RADIUS_METERS || '100');

// ─── PKT helpers ────────────────────────────────────────────────────────────
const pkNow  = () => new Date(Date.now() + 5 * 3600 * 1000);
const pkDate = () => pkNow().toISOString().split('T')[0]; // YYYY-MM-DD

function deriveStatus(checkInTime: Date): 'present' | 'late' {
  const pk   = new Date(checkInTime.getTime() + 5 * 3600 * 1000);
  const hour = pk.getUTCHours();
  const min  = pk.getUTCMinutes();
  // Late if after 09:15 PKT — adjust to your policy
  return hour > 9 || (hour === 9 && min > 15) ? 'late' : 'present';
}

// ────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // 1. Auth
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    // 2. Body
    const { qrToken, latitude, longitude, deviceInfo } = await req.json();

    if (!qrToken)
      return NextResponse.json({ success: false, message: 'QR token required' }, { status: 400 });

    if (latitude == null || longitude == null)
      return NextResponse.json(
        { success: false, message: 'Location is required. Please allow location access.' },
        { status: 400 },
      );

    // 3. Location validation
    const distance = haversineMeters(OFFICE_LAT, OFFICE_LNG, latitude, longitude);
    if (distance > OFFICE_RADIUS)
      return NextResponse.json(
        {
          success:  false,
          message:  `You must be at the office to mark attendance. You are ${Math.round(distance)} m away.`,
          distance: Math.round(distance),
          required: OFFICE_RADIUS,
        },
        { status: 403 },
      );

    // 4. Employee check
    const employee = await Employee.findById(decoded.id);
    if (!employee)
      return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });

    const today   = pkDate();
    const now     = new Date();
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // 5. Upsert — first scan = checkIn, second scan = checkOut
    const existing = await Attendance.findOne({ employeeId: decoded.id, date: today });

    if (!existing) {
      // ── CHECK-IN ──
      const status = deriveStatus(now);
      await Attendance.create({
        employeeId:    decoded.id,
        date:          today,
        checkIn:       now,
        status,
        latitude,
        longitude,
        location:      `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        ipAddress,
        deviceInfo:    deviceInfo || 'unknown',
        qrTokenUsed:   qrToken,
        isLate:        status === 'late',
        isWithinOffice: true,
      });

      return NextResponse.json({
        success: true,
        action:  'check-in',
        message: status === 'late' ? 'Checked in — marked as Late' : 'Checked in successfully',
        status,
        distance: Math.round(distance),
      });
    }

    if (!existing.checkOut) {
      // ── CHECK-OUT ──
      const workingHours =
        (now.getTime() - new Date(existing.checkIn!).getTime()) / (1000 * 60 * 60);
      const isEarlyLeave = workingHours < 8; // adjust threshold

      await Attendance.findByIdAndUpdate(existing._id, {
        checkOut:    now,
        workingHours: parseFloat(workingHours.toFixed(2)),
        isEarlyLeave,
        qrTokenUsed: qrToken,
      });

      return NextResponse.json({
        success: true,
        action:  'check-out',
        message: 'Checked out successfully',
        workingHours: parseFloat(workingHours.toFixed(2)),
        distance: Math.round(distance),
      });
    }

    // Already checked in AND out
    return NextResponse.json(
      { success: false, message: 'Attendance already completed for today.' },
      { status: 409 },
    );

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}