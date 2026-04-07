import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import jwt from "jsonwebtoken";

// =====================
// UPDATE STATUS (ADMIN)
// =====================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ IMPORTANT

    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token" },
        { status: 401 }
      );
    }

    jwt.verify(token, process.env.JWT_SECRET!); // optional: check role

    const { status } = await req.json();

    const ticket = await Ticket.findByIdAndUpdate(
      id, // ✅ use extracted id
      { status },
      { new: true }
    );

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Status updated",
      data: ticket,
    });

  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}