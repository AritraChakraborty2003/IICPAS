import mongoose from "mongoose";
import Student from "../models/Students.js";
import CoinSettings from "../models/CoinSettings.js";
import CoinTransaction from "../models/CoinTransaction.js";

export const getCoinSettings = async () => CoinSettings.getSettings();

export const awardCoins = async ({
  studentId,
  eventType,
  coins,
  metadata = {},
  idempotencyKey,
}) => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return { awarded: false, reason: "invalid_student_id" };
  }

  if (!idempotencyKey) {
    return { awarded: false, reason: "missing_idempotency_key" };
  }

  const student = await Student.findById(studentId).select("_id coinBalance");
  if (!student) {
    return { awarded: false, reason: "student_not_found" };
  }

  const existing = await CoinTransaction.findOne({ idempotencyKey });
  if (existing) {
    const latestStudent = await Student.findById(studentId).select("coinBalance");
    return {
      awarded: false,
      reason: "already_awarded",
      coinBalance: latestStudent?.coinBalance ?? 0,
      transaction: existing,
    };
  }

  const safeCoins = Number(coins);
  if (!Number.isFinite(safeCoins) || safeCoins <= 0) {
    return { awarded: false, reason: "invalid_coins" };
  }

  try {
    const transaction = await CoinTransaction.create({
      studentId,
      eventType,
      coins: safeCoins,
      metadata,
      idempotencyKey,
    });

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { $inc: { coinBalance: safeCoins } },
      { new: true, runValidators: true }
    ).select("coinBalance");

    return {
      awarded: true,
      coinBalance: updatedStudent?.coinBalance ?? 0,
      transaction,
    };
  } catch (error) {
    if (error?.code === 11000) {
      const latestStudent = await Student.findById(studentId).select("coinBalance");
      return {
        awarded: false,
        reason: "already_awarded",
        coinBalance: latestStudent?.coinBalance ?? 0,
      };
    }
    throw error;
  }
};

export const getStudentCoinSummary = async (studentId, limit = 10) => {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return null;
  }

  const student = await Student.findById(studentId).select("coinBalance");
  if (!student) return null;

  const recentTransactions = await CoinTransaction.find({ studentId })
    .sort({ createdAt: -1 })
    .limit(limit);

  return {
    studentId,
    coinBalance: student.coinBalance ?? 0,
    recentTransactions,
  };
};
