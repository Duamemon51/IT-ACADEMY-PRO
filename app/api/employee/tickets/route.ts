import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ticket from "@/models/Ticket";
import jwt from "jsonwebtoken";

// =====================
// GET ALL TICKETS
// =====================
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token" },
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const employeeId = decoded.id;

    const tickets = await Ticket.find({ employeeId }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      data: tickets || [],
    });

  } catch (err) {
    console.error("GET TICKETS ERROR:", err);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// =====================
// CREATE TICKET
// =====================
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token" },
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const employeeId = decoded.id;

    const body = await req.json();

    if (!body.type) {
      return NextResponse.json(
        { success: false, message: "Ticket type required" },
        { status: 400 }
      );
    }

    let ticketData: any = {
      employeeId,
      type: body.type,
      status: "pending",
    };

    // =====================
    // LEAVE
    // =====================
    if (body.type === "leave") {
      ticketData = {
        ...ticketData,
        leaveType: body.leaveType,
        fromDate: body.fromDate,
        toDate: body.toDate,
        leaveReason: body.leaveReason,
      };
    }

    // =====================
    // LATE CHECKIN
    // =====================
    if (body.type === "late_checkin") {
      ticketData = {
        ...ticketData,
        lateDate: body.lateDate,
        actualArrivalTime: body.actualArrivalTime,
        lateReason: body.lateReason || "",
      };
    }

    // =====================
    // OVERTIME
    // =====================
    if (body.type === "overtime") {
      ticketData = {
        ...ticketData,
        overtimeDate: body.overtimeDate,
        overtimeFrom: body.overtimeFrom,
        overtimeTo: body.overtimeTo,
        overtimeReason: body.overtimeReason || "",
        overtimeProject: body.overtimeProject || "",
      };
    }

    const ticketId = `TKT-${Date.now().toString().slice(-6)}`;
    ticketData.ticketId = ticketId;

    const ticket = await Ticket.create(ticketData);

    return NextResponse.json({
      success: true,
      message: "Ticket created",
      data: ticket,
    });

  } catch (err) {
    console.error("CREATE TICKET ERROR:", err);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}