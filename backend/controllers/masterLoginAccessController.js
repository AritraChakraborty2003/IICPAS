import {
  getLoginAccessUsers,
  deleteUserLoginAccessOverride,
  setBulkLoginStatus,
  setUserLoginStatus,
} from "../services/loginAccessService.js";

export const listLoginAccessUsers = async (req, res) => {
  try {
    const role = req.query.role || "all";
    const search = req.query.search || "";
    const status = req.query.status || "all";
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 200);

    const data = await getLoginAccessUsers({
      role,
      search,
      status,
      page,
      limit,
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateSingleLoginStatus = async (req, res) => {
  try {
    const { role, userId } = req.params;
    const { status } = req.body;
    const updatedBy = req.user?.email || req.user?.name || "master-admin";

    const item = await setUserLoginStatus({
      role,
      userId,
      status,
      updatedBy,
    });

    return res.status(200).json({
      message: "Login status updated",
      item,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteSingleLoginAccess = async (req, res) => {
  try {
    const { role, userId } = req.params;

    const item = await deleteUserLoginAccessOverride({
      role,
      userId,
    });

    return res.status(200).json({
      message: "User deleted successfully",
      item,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateBulkLoginStatus = async (req, res) => {
  try {
    const { role = "all", status, search = "" } = req.body;
    const updatedBy = req.user?.email || req.user?.name || "master-admin";

    const result = await setBulkLoginStatus({
      role,
      status,
      search,
      updatedBy,
    });

    return res.status(200).json({
      message: "Bulk login status update completed",
      ...result,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
