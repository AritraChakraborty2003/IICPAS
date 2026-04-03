"use client";
import { getApiBase } from "@/lib/apiBase";
import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Stack,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Swal from "sweetalert2";
import axios from "axios";

const API_BASE = getApiBase();

export default function AddChapterForm({ courseId, onCancel, onAdded }) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Active");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      Swal.fire("Validation Error", "Chapter title is required.", "warning");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/chapters/by-course/${courseId}`, {
        title: title.trim(),
        status,
        seoTitle: seoTitle.trim(),
        seoKeywords: seoKeywords.trim(),
        seoDescription: seoDescription.trim(),
        metaTitle: metaTitle.trim(),
        metaKeywords: metaKeywords.trim(),
        metaDescription: metaDescription.trim(),
      });
      setLoading(false);
      Swal.fire("Success", "Chapter added successfully!", "success");
      onAdded(); // Notify parent to refresh and close the form
    } catch (error) {
      setLoading(false);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to add chapter",
        "error"
      );
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        bgcolor: "white",
        p: 3,
        borderRadius: 2,
        boxShadow: 3,
        maxWidth: 800,
        mx: "auto",
      }}
    >
      <Typography variant="h6" mb={2}>
        Add Chapter
      </Typography>

      <TextField
        label="Chapter Title"
        fullWidth
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="status-label">Status</InputLabel>
        <Select
          labelId="status-label"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          required
        >
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </Select>
      </FormControl>

      {/* SEO Section */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">SEO Section</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField
              label="SEO Title"
              fullWidth
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Enter SEO title"
              helperText="Recommended: 50-60 characters"
            />
            
            <TextField
              label="SEO Keywords"
              fullWidth
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="Enter keywords separated by commas"
              helperText="Separate keywords with commas"
            />
            
            <TextField
              label="SEO Description"
              fullWidth
              multiline
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Enter SEO description"
              helperText="Recommended: 150-160 characters"
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Meta Tags Section */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Meta Tags</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField
              label="Meta Title"
              fullWidth
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Enter meta title"
              helperText="Recommended: 50-60 characters"
            />
            
            <TextField
              label="Meta Keywords"
              fullWidth
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              placeholder="Enter keywords separated by commas"
              helperText="Separate keywords with commas"
            />
            
            <TextField
              label="Meta Description"
              fullWidth
              multiline
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Enter meta description"
              helperText="Recommended: 150-160 characters"
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button variant="outlined" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Chapter"}
        </Button>
      </Stack>
    </Box>
  );
}
