// app/api/admin/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

// ✅ Import models BEFORE connectDB is called.
// Importing them here guarantees Mongoose registers both schemas
// in this route's module scope — even when the DB connection is
// already open from a previous request (cached readyState >= 1).
import '@/models/Employee'; // must come before Ticket
import Ticket from '@/models/Ticket';

import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const tickets = await Ticket.find()
      .populate('employeeId', 'name email employeeId department')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: tickets });

  } catch (err) {
    console.error('ADMIN GET TICKETS ERROR:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}