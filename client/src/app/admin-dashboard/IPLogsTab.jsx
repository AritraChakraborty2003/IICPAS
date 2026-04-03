"use client";
import { getApiBase } from "@/lib/apiBase";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  Search,
  FilterList,
  Refresh,
  Delete,
  Visibility,
  LocationOn,
  AccessTime,
  Person,
  Computer,
  Public,
  TrendingUp,
  Security,
} from "@mui/icons-material";
import dayjs from "dayjs";

const API_BASE =
  getApiBase();

const IPLogsTab = () => {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    userId: "",
    ip: "",
    route: "",
    method: "",
    statusCode: "",
    event: "",
    country: "",
    city: "",
    startDate: "",
    endDate: "",
  });
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFilters, setDeleteFilters] = useState({});

  // Fetch audit activities
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value)
        ),
      });

      const response = await axios.get(
        `${API_BASE}/audit/activities?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      setActivities(response.data.data);
      setTotal(response.data.pagination.total);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch audit statistics
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get(`${API_BASE}/audit/stats?days=7`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, rowsPerPage, filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleViewDetails = (activity) => {
    setSelectedActivity(activity);
    setDetailDialogOpen(true);
  };

  const handleDeleteActivities = async () => {
    try {
      const response = await axios.delete(`${API_BASE}/audit/activities`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        data: deleteFilters,
      });

      alert(`Successfully deleted ${response.data.deletedCount} activities`);
      setDeleteDialogOpen(false);
      setDeleteFilters({});
      fetchActivities();
      fetchStats();
    } catch (error) {
      console.error("Error deleting activities:", error);
      alert("Failed to delete activities");
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getLocationDisplay = (activity) => {
    const parts = [activity.city, activity.region, activity.country].filter(
      Boolean
    );
    return parts.length > 0 ? parts.join(", ") : "Unknown";
  };

  const getDeviceInfo = (userAgent) => {
    if (!userAgent) return "Unknown";

    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/.test(
      userAgent
    );

    if (isTablet) return "Tablet";
    if (isMobile) return "Mobile";
    return "Desktop";
  };

  const getBrowserInfo = (userAgent) => {
    if (!userAgent) return "Unknown";

    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Other";
  };

  const getStatusColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return "success";
    if (statusCode >= 300 && statusCode < 400) return "warning";
    if (statusCode >= 400 && statusCode < 500) return "error";
    if (statusCode >= 500) return "error";
    return "default";
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <Security color="primary" />
        IP Logs & User Activity
      </Typography>

      {/* Statistics Cards */}
      {!statsLoading && stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Activities
                </Typography>
                <Typography variant="h4">
                  {stats.totalActivities.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Unique Users
                </Typography>
                <Typography variant="h4">
                  {stats.uniqueUsers.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Unique IPs
                </Typography>
                <Typography variant="h4">
                  {stats.uniqueIPs.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Duration
                </Typography>
                <Typography variant="h4">
                  {formatDuration(stats.totalDuration)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <FilterList />
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="User ID"
              value={filters.userId}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="IP Address"
              value={filters.ip}
              onChange={(e) => handleFilterChange("ip", e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Route"
              value={filters.route}
              onChange={(e) => handleFilterChange("route", e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Method</InputLabel>
              <Select
                value={filters.method}
                onChange={(e) => handleFilterChange("method", e.target.value)}
                label="Method"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
                <MenuItem value="PATCH">PATCH</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Status Code"
              value={filters.statusCode}
              onChange={(e) => handleFilterChange("statusCode", e.target.value)}
              size="small"
              placeholder="e.g., 200, 404"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Event"
              value={filters.event}
              onChange={(e) => handleFilterChange("event", e.target.value)}
              size="small"
              placeholder="e.g., api_request, user_login"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Country"
              value={filters.country}
              onChange={(e) => handleFilterChange("country", e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="City"
              value={filters.city}
              onChange={(e) => handleFilterChange("city", e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "flex-end",
                height: "100%",
              }}
            >
              <Button
                variant="contained"
                onClick={fetchActivities}
                startIcon={<Refresh />}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
                startIcon={<Delete />}
              >
                Delete
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Activities Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User ID</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Route</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Device</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No activities found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity) => (
                  <TableRow key={activity._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        {activity.userId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={activity.ip}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace" }}
                      >
                        {activity.route}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={activity.method || "GET"}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={activity.statusCode || 200}
                        size="small"
                        color={getStatusColor(activity.statusCode)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2">
                          {getLocationDisplay(activity)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDuration(activity.duration)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getDeviceInfo(activity.userAgent)}
                        size="small"
                        color="secondary"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dayjs(activity.timestamp).format("MMM DD, YYYY HH:mm")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(activity)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>

      {/* Activity Details Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Activity Details</DialogTitle>
        <DialogContent>
          {selectedActivity && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  User ID
                </Typography>
                <Typography variant="body1">
                  {selectedActivity.userId}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  IP Address
                </Typography>
                <Typography variant="body1">{selectedActivity.ip}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Route
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: "monospace" }}>
                  {selectedActivity.route}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  HTTP Method
                </Typography>
                <Typography variant="body1">
                  {selectedActivity.method || "GET"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status Code
                </Typography>
                <Typography variant="body1">
                  {selectedActivity.statusCode || 200}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Request Size
                </Typography>
                <Typography variant="body1">
                  {selectedActivity.requestSize || 0} bytes
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Response Size
                </Typography>
                <Typography variant="body1">
                  {selectedActivity.responseSize || 0} bytes
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Location
                </Typography>
                <Typography variant="body1">
                  {getLocationDisplay(selectedActivity)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Duration
                </Typography>
                <Typography variant="body1">
                  {formatDuration(selectedActivity.duration)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Device Type
                </Typography>
                <Typography variant="body1">
                  {getDeviceInfo(selectedActivity.userAgent)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Browser
                </Typography>
                <Typography variant="body1">
                  {getBrowserInfo(selectedActivity.userAgent)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Session ID
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                >
                  {selectedActivity.sessionId}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Timestamp
                </Typography>
                <Typography variant="body1">
                  {dayjs(selectedActivity.timestamp).format(
                    "MMM DD, YYYY HH:mm:ss"
                  )}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  User Agent
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedActivity.userAgent}
                </Typography>
              </Grid>
              {selectedActivity.event && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Event
                  </Typography>
                  <Typography variant="body1">
                    {selectedActivity.event}
                  </Typography>
                </Grid>
              )}
              {selectedActivity.metadata &&
                Object.keys(selectedActivity.metadata).length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Metadata
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                    >
                      {JSON.stringify(selectedActivity.metadata, null, 2)}
                    </Typography>
                  </Grid>
                )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Activities</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This will permanently delete audit activities. Please specify
            deletion criteria:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="User ID (optional)"
                value={deleteFilters.userId || ""}
                onChange={(e) =>
                  setDeleteFilters((prev) => ({
                    ...prev,
                    userId: e.target.value,
                  }))
                }
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="IP Address (optional)"
                value={deleteFilters.ip || ""}
                onChange={(e) =>
                  setDeleteFilters((prev) => ({ ...prev, ip: e.target.value }))
                }
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date (optional)"
                value={deleteFilters.startDate || ""}
                onChange={(e) =>
                  setDeleteFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date (optional)"
                value={deleteFilters.endDate || ""}
                onChange={(e) =>
                  setDeleteFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteActivities}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IPLogsTab;
