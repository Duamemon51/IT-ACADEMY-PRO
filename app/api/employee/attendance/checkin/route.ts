import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import jwt from 'jsonwebtoken';

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

const OFFICE_LAT    = parseFloat(process.env.OFFICE_LATITUDE!);
const OFFICE_LNG    = parseFloat(process.env.OFFICE_LONGITUDE!);
const OFFICE_RADIUS = parseFloat(process.env.OFFICE_RADIUS_METERS || '100');

const pkNow  = () => new Date(Date.now() + 5 * 3600 * 1000);
const pkDate = () => pkNow().toISOString().split('T')[0];

function deriveStatus(checkInTime: Date): 'present' | 'late' {
  const pk   = new Date(checkInTime.getTime() + 5 * 3600 * 1000);
  const hour = pk.getUTCHours();
  const min  = pk.getUTCMinutes();
  return hour > 9 || (hour === 9 && min > 15) ? 'late' : 'present';
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    console.log('=== CHECKIN API HIT ===');

    // 1. Auth
    const token = req.headers.get('authorization')?.split(' ')[1];
    console.log('TOKEN:', token ? `${token.substring(0, 30)}...` : 'NULL');
    
    if (!token)
      return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      console.log('TOKEN DECODED:', JSON.stringify(decoded));
    } catch (jwtErr) {
      console.log('JWT ERROR:', jwtErr);
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    // 2. Body
    const body = await req.json();
    console.log('REQUEST BODY:', JSON.stringify(body));
    
    const { qrToken, latitude, longitude, deviceInfo } = body;

    if (!qrToken) {
      console.log('ERROR: qrToken missing');
      return NextResponse.json({ success: false, message: 'QR token required' }, { status: 400 });
    }

    if (latitude == null || longitude == null) {
      console.log('ERROR: location missing', { latitude, longitude });
      return NextResponse.json(
        { success: false, message: 'Location is required.' },
        { status: 400 },
      );
    }

    // 3. Employee dhundo
    console.log('SEARCHING EMPLOYEE WITH qrToken:', qrToken);
    const employee = await Employee.findOne({ qrToken });
    console.log('EMPLOYEE FOUND:', employee ? `${employee.name} (${employee.employeeId})` : 'NULL');
    
    if (!employee) {
      // DB mein kitne employees hain aur unke qrToken check karo
      const allEmps = await Employee.find({}).select('name employeeId qrToken').limit(3);
      console.log('SAMPLE EMPLOYEES IN DB:', JSON.stringify(allEmps));
      
      return NextResponse.json(
        { success: false, message: 'Invalid QR code. Employee not found.' },
        { status: 404 },
      );
    }

    // 4. Location validation
    console.log('OFFICE:', { OFFICE_LAT, OFFICE_LNG, OFFICE_RADIUS });
    console.log('EMPLOYEE LOCATION:', { latitude, longitude });
    
    const distance = haversineMeters(OFFICE_LAT, OFFICE_LNG, latitude, longitude);
    console.log('DISTANCE FROM OFFICE:', Math.round(distance), 'm');
    
    if (distance > OFFICE_RADIUS)
      return NextResponse.json(
        {
          success:  false,
          message:  `You must be at the office. You are ${Math.round(distance)} m away.`,
          distance: Math.round(distance),
          required: OFFICE_RADIUS,
        },
        { status: 403 },
      );

    const today     = pkDate();
    const now       = new Date();
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    console.log('TODAY (PKT):', today);

    // 5. Upsert
    const existing = await Attendance.findOne({ employeeId: employee._id, date: today });
    console.log('EXISTING ATTENDANCE:', existing ? `checkIn: ${existing.checkIn}, checkOut: ${existing.checkOut}` : 'NONE');

    if (!existing) {
      const status = deriveStatus(now);
      console.log('CREATING CHECK-IN, status:', status);
      
      await Attendance.create({
        employeeId:     employee._id,
        date:           today,
        checkIn:        now,
        status,
        latitude,
        longitude,
        location:       `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        ipAddress,
        deviceInfo:     deviceInfo || 'unknown',
        qrTokenUsed:    qrToken,
        isLate:         status === 'late',
        isWithinOffice: true,
      });

      console.log('CHECK-IN SUCCESS');
      return NextResponse.json({
        success:      true,
        action:       'check-in',
        message:      status === 'late' ? 'Checked in — marked as Late' : 'Checked in successfully',
        status,
        distance:     Math.round(distance),
        employeeName: employee.name,
        employeeId:   employee.employeeId,
      });
    }

    if (!existing.checkOut) {
      const workingHours =
        (now.getTime() - new Date(existing.checkIn!).getTime()) / (1000 * 60 * 60);
      const isEarlyLeave = workingHours < 8;

      console.log('CREATING CHECK-OUT, workingHours:', workingHours.toFixed(2));

      await Attendance.findByIdAndUpdate(existing._id, {
        checkOut:     now,
        workingHours: parseFloat(workingHours.toFixed(2)),
        isEarlyLeave,
        qrTokenUsed:  qrToken,
      });

      console.log('CHECK-OUT SUCCESS');
      return NextResponse.json({
        success:      true,
        action:       'check-out',
        message:      'Checked out successfully',
        workingHours: parseFloat(workingHours.toFixed(2)),
        distance:     Math.round(distance),
        employeeName: employee.name,
        employeeId:   employee.employeeId,
      });
    }

    console.log('ATTENDANCE ALREADY COMPLETED');
    return NextResponse.json(
      { success: false, message: 'Attendance already completed for today.' },
      { status: 409 },
    );

  } catch (err) {
    console.error('=== CHECKIN API ERROR ===', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}