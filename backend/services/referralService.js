import crypto from "crypto";
import Student from "../models/Students.js";

const normalizeReferralSeed = (value = "") => {
  const normalized = value
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return normalized.slice(0, 4) || "IICP";
};

export const normalizeReferralCode = (value = "") =>
  value
    .toString()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);

const generateReferralCandidate = (seed = "IICPA") => {
  const prefix = normalizeReferralSeed(seed);
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${suffix}`.slice(0, 10);
};

export const generateUniqueReferralCode = async (seed = "IICPA") => {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const code = generateReferralCandidate(seed);
    const existing = await Student.exists({ referralCode: code });
    if (!existing) {
      return code;
    }
  }

  throw new Error("Unable to generate a unique referral code");
};

export const ensureStudentReferralCode = async (studentDoc) => {
  if (!studentDoc) return "";
  if (studentDoc.referralCode) return studentDoc.referralCode;

  const code = await generateUniqueReferralCode(
    studentDoc.name || studentDoc.email || "IICPA"
  );

  studentDoc.referralCode = code;
  await studentDoc.save();
  return code;
};
