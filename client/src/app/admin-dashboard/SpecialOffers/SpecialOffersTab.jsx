"use client";
import { getApiBase } from "@/lib/apiBase";

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PartyMode as PartyModeIcon,
  CardGiftcard as GiftIcon,
  Star as StarIcon,
  LocalFireDepartment as FireIcon,
  EmojiEvents as TrophyIcon,
  Diamond as DiamondIcon,
} from "@mui/icons-material";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE =
  getApiBase();
const SpecialOffersTab = ({ onBack }) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "party_pomp",
    backgroundColor: "#FF6B6B",
    textColor: "#FFFFFF",
    expiryDate: "",
    priority: 1,
    displayLocation: "admin_dashboard",
    isActive: true,
  });

  const iconOptions = [
    { value: "party_pomp", label: "Party Pomp", icon: <PartyModeIcon /> },
    { value: "gift", label: "Gift", icon: <GiftIcon /> },
    { value: "star", label: "Star", icon: <StarIcon /> },
    { value: "fire", label: "Fire", icon: <FireIcon /> },
    { value: "trophy", label: "Trophy", icon: <TrophyIcon /> },
    { value: "diamond", label: "Diamond", icon: <DiamondIcon /> },
  ];

  const displayLocations = [
    { value: "admin_dashboard", label: "Admin Dashboard" },
    { value: "public_homepage", label: "Public Homepage" },
    { value: "course_page", label: "Course Page" },
    { value: "all", label: "All Locations" },
  ];

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/special-offers`);
      setOffers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching special offers:", error);
      toast.error("Failed to fetch special offers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingOffer(null);
    setFormData({
      title: "",
      description: "",
      icon: "party_pomp",
      backgroundColor: "#FF6B6B",
      textColor: "#FFFFFF",
      expiryDate: "",
      priority: 1,
      displayLocation: "admin_dashboard",
      isActive: true,
    });
    setOpenDialog(true);
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      icon: offer.icon,
      backgroundColor: offer.backgroundColor,
      textColor: offer.textColor,
      expiryDate: new Date(offer.expiryDate).toISOString().slice(0, 16),
      priority: offer.priority,
      displayLocation: offer.displayLocation,
      isActive: offer.isActive,
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description || !formData.expiryDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingOffer) {
        await axios.put(
          `${API_BASE}/special-offers/${editingOffer._id}`,
          formData
        );
        toast.success("Special offer updated successfully!");
      } else {
        await axios.post(`${API_BASE}/special-offers`, formData);
        toast.success("Special offer created successfully!");
      }
      setOpenDialog(false);
      fetchOffers();
    } catch (error) {
      console.error("Error saving special offer:", error);
      toast.error("Failed to save special offer");
    }
  };

  const handleDelete = async (offerId) => {
    if (window.confirm("Are you sure you want to delete this special offer?")) {
      try {
        await axios.delete(`${API_BASE}/special-offers/${offerId}`);
        toast.success("Special offer deleted successfully!");
        fetchOffers();
      } catch (error) {
        console.error("Error deleting special offer:", error);
        toast.error("Failed to delete special offer");
      }
    }
  };

  const handleToggleStatus = async (offerId) => {
    try {
      await axios.patch(`${API_BASE}/special-offers/${offerId}/toggle`);
      toast.success("Special offer status updated!");
      fetchOffers();
    } catch (error) {
      console.error("Error toggling offer status:", error);
      toast.error("Failed to update offer status");
    }
  };

  const getIconComponent = (iconName) => {
    const iconOption = iconOptions.find((option) => option.value === iconName);
    return iconOption ? iconOption.icon : <PartyModeIcon />;
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const getStatusColor = (offer) => {
    if (!offer.isActive) return "default";
    if (isExpired(offer.expiryDate)) return "error";
    return "success";
  };

  const getStatusText = (offer) => {
    if (!offer.isActive) return "Inactive";
    if (isExpired(offer.expiryDate)) return "Expired";
    return "Active";
  };

  return (
    <Box sx={{ height: "auto", minHeight: "100vh", p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          onClick={onBack}
          sx={{ minWidth: "auto", px: 2 }}
        >
          ← Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Special Offers Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddNew}
          sx={{ ml: "auto" }}
        >
          Add Special Offer
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {offers.map((offer) => (
          <Grid item xs={12} md={6} lg={4} key={offer._id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                border: `2px solid ${offer.backgroundColor}`,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  backgroundColor: offer.backgroundColor,
                  color: offer.textColor,
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {getIconComponent(offer.icon)}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {offer.title}
                  </Typography>
                </Box>
                <Chip
                  label={getStatusText(offer)}
                  color={getStatusColor(offer)}
                  size="small"
                />
              </Box>

              <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ mb: 2, color: "text.secondary" }}
                >
                  {offer.description}
                </Typography>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Expires:</strong>{" "}
                    {new Date(offer.expiryDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Priority:</strong> {offer.priority}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Location:</strong>{" "}
                    {offer.displayLocation.replace("_", " ")}
                  </Typography>
                </Stack>

                {isExpired(offer.expiryDate) && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    This offer has expired
                  </Alert>
                )}
              </CardContent>

              <Box sx={{ p: 2, pt: 0 }}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <IconButton
                    size="small"
                    onClick={() => handleToggleStatus(offer._id)}
                    color={offer.isActive ? "success" : "default"}
                  >
                    {offer.isActive ? (
                      <VisibilityIcon />
                    ) : (
                      <VisibilityOffIcon />
                    )}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(offer)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(offer._id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {offers.length === 0 && !loading && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
          }}
        >
          <PartyModeIcon
            sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No Special Offers Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first special offer to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
          >
            Add Special Offer
          </Button>
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingOffer ? "Edit Special Offer" : "Add Special Offer"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title *"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Flash Sale! 50% Off All Courses"
            />

            <TextField
              fullWidth
              label="Description *"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the special offer..."
            />

            <FormControl fullWidth>
              <InputLabel>Icon</InputLabel>
              <Select
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                label="Icon"
              >
                {iconOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {option.icon}
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Expiry Date & Time *"
              type="datetime-local"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value),
                    })
                  }
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Display Location</InputLabel>
                  <Select
                    value={formData.displayLocation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayLocation: e.target.value,
                      })
                    }
                    label="Display Location"
                  >
                    {displayLocations.map((location) => (
                      <MenuItem key={location.value} value={location.value}>
                        {location.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingOffer ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SpecialOffersTab;
