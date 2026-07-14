import SimulationConfig from "../models/SimulationConfig.js";
import SimulationOverride from "../models/SimulationOverride.js";

// Known simulations that self-seed on first read.
// Add new slugs here (or via the admin "Add Simulation" form).
const KNOWN_SIMULATIONS = {
  "gst-e-invoicing-1": { name: "GST e-Invoicing 1" },
};

const ensureKnownSimulation = async (slug) => {
  const known = KNOWN_SIMULATIONS[slug];
  if (!known) return null;
  return SimulationConfig.findOneAndUpdate(
    { slug },
    { $setOnInsert: { slug, name: known.name } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const sanitizeCredentialFields = (fields) => {
  if (!Array.isArray(fields)) return null;
  return fields
    .map((field) => ({
      label: String(field?.label || "").trim(),
      value: String(field?.value ?? ""),
    }))
    .filter((field) => field.label);
};

// Normalize a config's credential fields, converting the legacy
// { username, password } shape when the field list is empty.
const toCredentialFields = (config) => {
  if (config.credentialFields?.length) {
    return config.credentialFields.map((field) => ({
      label: field.label,
      value: field.value,
    }));
  }
  const legacy = config.credentials || {};
  const fields = [];
  if (legacy.username) fields.push({ label: "Username", value: legacy.username });
  if (legacy.password) fields.push({ label: "Password", value: legacy.password });
  return fields;
};

const serializeConfig = (config) => ({
  _id: config._id,
  slug: config.slug,
  name: config.name,
  credentialFields: toCredentialFields(config),
  bannerText: config.bannerText || "",
  requireCredentialValidation: config.requireCredentialValidation,
  isActive: config.isActive,
  createdAt: config.createdAt,
  updatedAt: config.updatedAt,
});

// Public — used by the student-facing simulation pages
export const getConfigBySlug = async (req, res) => {
  try {
    const slug = String(req.params.slug || "").toLowerCase().trim();
    let config = await SimulationConfig.findOne({ slug });
    if (!config) {
      config = await ensureKnownSimulation(slug);
    }
    if (!config) {
      return res.status(404).json({ message: "Simulation not found" });
    }
    res.json({
      slug: config.slug,
      name: config.name,
      credentialFields: toCredentialFields(config),
      bannerText: config.bannerText || "",
      requireCredentialValidation: config.requireCredentialValidation,
      isActive: config.isActive,
    });
  } catch (error) {
    console.error("Error fetching simulation config:", error);
    res.status(500).json({ message: "Failed to fetch simulation config" });
  }
};

// Admin — list all configs (ensures known simulations always appear)
export const getAllConfigs = async (req, res) => {
  try {
    await Promise.all(
      Object.keys(KNOWN_SIMULATIONS).map((slug) => ensureKnownSimulation(slug))
    );
    const configs = await SimulationConfig.find().sort({ slug: 1 });
    res.json(configs.map(serializeConfig));
  } catch (error) {
    console.error("Error fetching simulation configs:", error);
    res.status(500).json({ message: "Failed to fetch simulation configs" });
  }
};

// Admin — register a new simulation
export const createConfig = async (req, res) => {
  try {
    const {
      slug,
      name,
      credentialFields,
      bannerText,
      requireCredentialValidation,
      isActive,
    } = req.body;
    if (!slug || !name) {
      return res.status(400).json({ message: "slug and name are required" });
    }
    const existing = await SimulationConfig.findOne({
      slug: String(slug).toLowerCase().trim(),
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "A simulation with this slug already exists" });
    }
    const sanitizedFields = sanitizeCredentialFields(credentialFields);
    const config = await SimulationConfig.create({
      slug,
      name,
      ...(sanitizedFields ? { credentialFields: sanitizedFields } : {}),
      ...(bannerText !== undefined ? { bannerText: String(bannerText) } : {}),
      ...(requireCredentialValidation !== undefined
        ? { requireCredentialValidation }
        : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    });
    res.status(201).json(serializeConfig(config));
  } catch (error) {
    console.error("Error creating simulation config:", error);
    res.status(500).json({ message: "Failed to create simulation config" });
  }
};

// Admin — update credential fields/settings
export const updateConfig = async (req, res) => {
  try {
    const { name, credentialFields, bannerText, requireCredentialValidation, isActive } =
      req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    const sanitizedFields = sanitizeCredentialFields(credentialFields);
    if (sanitizedFields !== null) update.credentialFields = sanitizedFields;
    if (bannerText !== undefined) update.bannerText = String(bannerText);
    if (requireCredentialValidation !== undefined)
      update.requireCredentialValidation = requireCredentialValidation;
    if (isActive !== undefined) update.isActive = isActive;

    const config = await SimulationConfig.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!config) {
      return res.status(404).json({ message: "Simulation not found" });
    }
    res.json(serializeConfig(config));
  } catch (error) {
    console.error("Error updating simulation config:", error);
    res.status(500).json({ message: "Failed to update simulation config" });
  }
};

// ── Per-insert overrides (created from the course editor's Quick Inserts) ──
// An override is referenced from the inserted simulation URL via ?simCfg=<id>
// and takes precedence over the slug-level SimulationConfig.

// Public — used by simulation pages and the digital hub when the
// simulation URL carries ?simCfg=<id>
export const getOverrideById = async (req, res) => {
  try {
    const override = await SimulationOverride.findById(req.params.id);
    if (!override) {
      return res.status(404).json({ message: "Simulation override not found" });
    }
    res.json({
      _id: override._id,
      slug: override.slug,
      name: override.name,
      credentialFields: (override.credentialFields || []).map((field) => ({
        label: field.label,
        value: field.value,
      })),
      bannerText: override.bannerText || "",
      requireCredentialValidation: override.requireCredentialValidation,
      isActive: override.isActive,
    });
  } catch (error) {
    console.error("Error fetching simulation override:", error);
    res.status(500).json({ message: "Failed to fetch simulation override" });
  }
};

// Admin — create an override for one inserted simulation
export const createOverride = async (req, res) => {
  try {
    const { slug, name, credentialFields, bannerText, requireCredentialValidation } =
      req.body;
    if (!slug) {
      return res.status(400).json({ message: "slug is required" });
    }
    const sanitizedFields = sanitizeCredentialFields(credentialFields) || [];
    if (!sanitizedFields.length && !String(bannerText || "").trim()) {
      return res
        .status(400)
        .json({ message: "At least one credential field or banner text is required" });
    }
    const override = await SimulationOverride.create({
      slug,
      name: name || slug,
      credentialFields: sanitizedFields,
      bannerText: String(bannerText || ""),
      ...(requireCredentialValidation !== undefined
        ? { requireCredentialValidation }
        : {}),
    });
    res.status(201).json({ _id: override._id, slug: override.slug });
  } catch (error) {
    console.error("Error creating simulation override:", error);
    res.status(500).json({ message: "Failed to create simulation override" });
  }
};

// Admin — remove an override (when its simulation card is deleted)
export const deleteOverride = async (req, res) => {
  try {
    const override = await SimulationOverride.findByIdAndDelete(req.params.id);
    if (!override) {
      return res.status(404).json({ message: "Simulation override not found" });
    }
    res.json({ message: "Simulation override deleted" });
  } catch (error) {
    console.error("Error deleting simulation override:", error);
    res.status(500).json({ message: "Failed to delete simulation override" });
  }
};

// Admin — delete a simulation config
export const deleteConfig = async (req, res) => {
  try {
    const config = await SimulationConfig.findByIdAndDelete(req.params.id);
    if (!config) {
      return res.status(404).json({ message: "Simulation not found" });
    }
    res.json({ message: "Simulation config deleted" });
  } catch (error) {
    console.error("Error deleting simulation config:", error);
    res.status(500).json({ message: "Failed to delete simulation config" });
  }
};
