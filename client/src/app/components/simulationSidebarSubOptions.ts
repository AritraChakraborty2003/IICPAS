// Sub-options shown under each sidebar menu in the GST e-invoicing
// simulations (e-invoicing-1..4), mirroring the NIC e-Invoice portal.
export const SIDEBAR_SUB_OPTIONS: Record<string, string[]> = {
  "MIS Reports": [
    "Generated IRNs",
    "Cancelled IRNs",
    "Generated e-Way Bills",
    "Rejected IRNs",
    "Report Downloads",
  ],
  "User Management": [
    "Create Sub User",
    "Freeze Sub User",
    "Update Sub User",
    "Change Password",
    "Reset Password",
    "User List",
  ],
  "API Registration": [
    "API Registration",
    "API Credentials",
    "Manage Client ID",
    "API Logs",
  ],
  "Change Password": ["Change Login Password"],
  "Feedback on GePP": ["Submit Feedback", "View Feedback"],
  "Update Contact Details": ["Update Mobile Number", "Update Email ID"],
  Update: ["Update GST Details", "Update Business Details"],
  "e-Way Bill": [
    "Generate e-Way Bill",
    "Generate Bulk e-Way Bill",
    "Update Part-B",
    "Extend Validity",
    "Consolidated e-Way Bill",
    "Cancel e-Way Bill",
    "Print e-Way Bill",
  ],
  "2 Factor Authentication": [
    "Enable 2FA",
    "Disable 2FA",
    "Configure Authenticator App",
  ],
};
