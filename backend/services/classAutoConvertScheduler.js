import ClassSession from "../models/ClassManagement/ClassSession.js";

/**
 * Background job: auto-converts finished LIVE classes into RECORDED classes.
 *
 * A class is "finished" once its endAt (date + time + duration) is in the past.
 * On conversion we flip type -> "recorded", status -> "completed" and stamp
 * convertedAt so the sweep is idempotent (autoConverted guards re-processing).
 */

let sweepRunning = false;
let schedulerStarted = false;

export const processFinishedClasses = async () => {
  if (sweepRunning) return;
  sweepRunning = true;

  try {
    const now = new Date();
    const result = await ClassSession.updateMany(
      {
        type: "live",
        autoConverted: false,
        endAt: { $lte: now },
      },
      {
        $set: {
          type: "recorded",
          status: "completed",
          autoConverted: true,
          convertedAt: now,
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `[classAutoConvert] Converted ${result.modifiedCount} live class(es) to recorded`
      );
    }
  } catch (error) {
    console.error("[classAutoConvert] sweep failed:", error.message);
  } finally {
    sweepRunning = false;
  }
};

export const startClassAutoConvertScheduler = () => {
  if (schedulerStarted) return;
  schedulerStarted = true;
  console.log("Class auto-convert scheduler started");

  void processFinishedClasses();

  const timer = setInterval(() => {
    void processFinishedClasses();
  }, 60 * 1000);

  if (typeof timer.unref === "function") {
    timer.unref();
  }
};
