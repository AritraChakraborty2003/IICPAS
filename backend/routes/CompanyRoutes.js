import express from "express";
import Company from "../models/Company.js";
import {
  registerCompany,
  loginCompany,
  sendOtp,
  resetPassword,
  getAllCompanies,
  approveCompany,
  toggleCompanyStatus,
  deleteCompany,
  logoutCompany,
  updateCompanyProfile,
  getCompanyDocuments,
} from "../controllers/companyControllers.js";
import {
  uploadCompanyDoc,
  uploadCompanyImage,
} from "../middleware/multerUpload.js";
import { isCompany } from "../middleware/isCompany.js";
const router = express.Router();

router.post("/register", uploadCompanyDoc.single("document"), registerCompany);
router.post("/login", loginCompany);
router.post("/forgot-password", sendOtp);
router.post("/reset-password", resetPassword);
router.post("/logout", logoutCompany);
router.get("/iscompany", isCompany, async (req, res) => {
  try {
    const company = await Company.findById(req.company.id);

    console.log("company:", company);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({
      message: "Authenticated company",
      company: {
        id: company._id,
        _id: company._id,
        fullName: company.fullName,
        email: company.email,
        phone: company.phone,
        image: company.image,
        documentPath: company.documentPath,
        status: company.status,
      },
    });
  } catch (error) {
    console.error("Error fetching company data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Company profile and document routes
router.put(
  "/profile",
  isCompany,
  uploadCompanyImage.single("profileImage"),
  updateCompanyProfile
);
router.post("/documents", isCompany, getCompanyDocuments);

// Admin routes
router.get("/", getAllCompanies);
router.put("/approve/:id", approveCompany);
router.patch("/toggle-status/:id", toggleCompanyStatus);
router.delete("/:id", deleteCompany);

export default router;
