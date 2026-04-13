// app/api/admin/tickets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

// ✅ Same fix: register Employee schema before any Ticket operation
import '@/models/Employee';
import Ticket from '@/models/Ticket';

import jwt from 'jsonwebtoken';

// ── PATCH — Approve / Reject ────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { status } = await req.json();
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { status, reviewedBy: decoded.id, reviewedAt: new Date() },
      { new: true }
    );

    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Ticket ${status}`, data: ticket });

  } catch (err) {
    console.error('ADMIN PATCH TICKET ERROR:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// ── DELETE ──────────────────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, message: 'No token' }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const ticket = await Ticket.findByIdAndDelete(id);
    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Ticket deleted' });

  } catch (err) {
    console.error('DELETE TICKET ERROR:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}