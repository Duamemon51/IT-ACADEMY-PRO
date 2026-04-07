import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import jwt from 'jsonwebtoken';

// =====================
// GET ALL TICKETS (Admin)
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

    // Only allow admin
    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      );
    }

    const tickets = await Ticket.find()
      .populate('employeeId', 'name email employeeId department')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: tickets,
    });

  } catch (err) {
    console.error('ADMIN GET TICKETS ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}