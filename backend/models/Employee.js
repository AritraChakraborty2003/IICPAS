import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "Manager", "Coordinator", "Content Writer", "Viewer"],
    },
    image: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    permissions: {
      // Course Management
      "course-category": {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      course: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      "live-session": {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      // Website Settings
      blogs: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      testimonials: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      about: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      hero: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      meta: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      alert: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      // Other Modules
      enquiries: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      jobs: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      news: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      center: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      students: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      staff: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      companies: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      colleges: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      calendar: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      team: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      topics: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      revision: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      support: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      "individual-requests": {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      "booking-settings": {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      "invoice-company-settings": {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      "job-sidebar-marquee": {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
      bookings: {
        add: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        active: { type: Boolean, default: false },
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
employeeSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check permission
employeeSchema.methods.hasPermission = function (module, action) {
  // Admin users have all permissions
  if (this.role === "Admin") return true;
  if (!this.permissions[module]) return false;
  return this.permissions[module][action] || false;
};

// Method to get all accessible modules
employeeSchema.methods.getAccessibleModules = function () {
  // Admin users can access all modules
  if (this.role === "Admin") {
    return Object.keys(this.permissions);
  }

  const accessible = [];
  Object.keys(this.permissions).forEach((module) => {
    if (this.permissions[module].read) {
      accessible.push(module);
    }
  });
  return accessible;
};

export default mongoose.model("Employee", employeeSchema);
