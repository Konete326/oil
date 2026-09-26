import mongoose from "mongoose";

const employeeAdvanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Advance Given", "Salary Deduction", "Manual Adjustment"],
      default: "Advance Given",
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    runningBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMode: {
      type: String,
      default: "Cash",
    },
    voucherNumber: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    recordedBy: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true }
);

employeeAdvanceSchema.index({ employee: 1, date: -1 });

export const EmployeeAdvance = mongoose.model("EmployeeAdvance", employeeAdvanceSchema);
