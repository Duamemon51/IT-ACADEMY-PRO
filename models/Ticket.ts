// models/Ticket.ts
import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    type: {
      type: String,
      enum: ["leave", "late_checkin", "overtime"],
      required: true,
    },

    leaveType: String,

    fromDate: String,
    toDate: String,
    leaveReason: String,

    lateDate: String,
    actualArrivalTime: String,
    lateReason: String,

    overtimeDate: String,
    overtimeFrom: String,
    overtimeTo: String,
    overtimeReason: String,
    overtimeProject: String,

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Ticket ||
  mongoose.model("Ticket", TicketSchema);