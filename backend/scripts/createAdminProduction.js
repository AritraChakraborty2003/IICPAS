import axios from "axios";

// Production API URL
const API_BASE = "https://api.iicpa.in/api";

// Admin user data
const adminData = {
  name: "Admin User",
  email: "admin@iicpa.com",
  password: "admin123",
  role: "Admin",
  status: "Active",
  permissions: {
    // Course Management
    "course-category": {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    course: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    "live-session": {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    "class-management": {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    // Website Settings
    blogs: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    testimonials: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    about: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    hero: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    meta: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    alert: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    // Other Modules
    enquiries: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    jobs: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    news: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    center: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    students: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    staff: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    companies: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    colleges: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    calendar: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    team: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    topics: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    revision: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
    support: {
      add: true,
      read: true,
      update: true,
      delete: true,
      active: true,
    },
  },
};

async function createAdminProduction() {
  try {
    console.log("🚀 Creating admin user on production API...");

    // First, try to login to see if admin already exists
    try {
      const loginResponse = await axios.post(`${API_BASE}/employees/login`, {
        email: adminData.email,
        password: adminData.password,
      });

      if (loginResponse.data) {
        console.log("✅ Admin user already exists and can login!");
        console.log("📧 Email:", adminData.email);
        console.log("🔑 Password: admin123");
        console.log("👤 Role: Admin");
        console.log("✅ Status: Active");
        console.log("🔐 All permissions granted");
        return;
      }
    } catch (loginError) {
      // Admin doesn't exist or can't login, proceed with registration
      console.log("ℹ️ Admin user doesn't exist, creating new one...");
    }

    // Create new admin user
    const response = await axios.post(`${API_BASE}/employees`, adminData, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 201 || response.status === 200) {
      console.log("✅ Admin user created successfully on production!");
      console.log("📧 Email:", adminData.email);
      console.log("🔑 Password: admin123");
      console.log("👤 Role: Admin");
      console.log("✅ Status: Active");
      console.log("🔐 All permissions granted");
      console.log("🎯 Ready to login at: https://www.iicpa.in/admin");
    } else {
      console.log("⚠️ Unexpected response:", response.status, response.data);
    }
  } catch (error) {
    console.error(
      "❌ Error creating admin on production:",
      error.response?.data || error.message
    );

    if (error.response?.status === 400) {
      console.log("ℹ️ Admin user might already exist. Try logging in with:");
      console.log("📧 Email: admin@iicpa.com");
      console.log("🔑 Password: admin123");
    }
  }
}

// Run the script
createAdminProduction();
