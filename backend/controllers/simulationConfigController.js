import SimulationConfig from "../models/SimulationConfig.js";
import SimulationOverride from "../models/SimulationOverride.js";

// Known simulations that self-seed on first read.
// Add new slugs here (or via the admin "Add Simulation" form). Optional
// credentialFields become the editable defaults shown in the Simulation
// Manager; admins can change any value without touching code.
const KNOWN_SIMULATIONS = {
  "gst-e-invoicing-1": { name: "GST e-Invoicing 1" },
  // NOTE: keep "Name" before "Father's/Husband's Name" — the client picks the
  // first label matching /name/i as the member's name.
  "epf-reg-4": {
    name: "EPF Reg 4 — Member Registration (Previous UAN)",
    bannerText:
      "To perform this experiment, open Member → Register-Individual, choose Yes for Previous Employment/UAN, enter UAN 101799815726, Name Keerthan Kumar and Date of Birth 22/02/1988, click Verify, then Save the prefilled registration form.",
    credentialFields: [
      { label: "UAN", value: "101799815726" },
      { label: "Name", value: "Keerthan Kumar" },
      { label: "Date of Birth", value: "22/02/1988" },
      { label: "AADHAAR", value: "353567678888" },
      { label: "Father's/Husband's Name", value: "NARAYAN SWAMY" },
      { label: "Marital Status", value: "MARRIED" },
      { label: "Mobile", value: "9900008797" },
      { label: "Email", value: "keerthan292@gmail.com" },
      { label: "Qualification", value: "GRADUATE" },
      { label: "Date of Joining", value: "20/01/2024" },
      { label: "Member Id", value: "0000000201" },
    ],
  },
  "epf-reg-7": {
    name: "EPF Reg 7 — Member Profile / Mark Exit",
    bannerText:
      "To perform this experiment, open Member → Member Profile, search UAN 101999827383, open the Mark Exit tab, select an Exit Reason, enter Exit Date (EPF) and Exit Date (EPS), then click Save.",
    credentialFields: [
      { label: "Company Name", value: "IICPA PRIVATE LIMITED" },
      { label: "Welcome Name", value: "IICPA PRIVATE LIMITED" },
      { label: "Est Id", value: "APHYD1577313000" },
      { label: "LIN", value: "9778613527" },
      { label: "Company PAN", value: "BGRPA6026U" },
      { label: "UAN", value: "101999827383" },
      { label: "Name", value: "RIYA VERMA" },
      { label: "Member Id", value: "101999" },
      { label: "Badge Id", value: "91519494838" },
      { label: "Date of Birth", value: "22/12/1997" },
      { label: "Date of Joining", value: "01/01/2024" },
      { label: "Gender", value: "Female" },
      { label: "Marital Status", value: "Married" },
      { label: "Father's/Husband's Name", value: "RAJ VERMA" },
      { label: "Relation", value: "-" },
      { label: "Mobile", value: "9937373939" },
      { label: "Email", value: "riyaverma1@gmail.com" },
      { label: "International Worker", value: "No" },
      { label: "Qualification", value: "-" },
      { label: "Monthly EPF Wages", value: "19000" },
      { label: "Differently Abled", value: "NO" },
      { label: "Nomination", value: "Not Filed" },
    ],
  },
  "itr-reg-1": {
    name: "ITR Reg 1 — Individual Taxpayer Registration",
    bannerText:
      "Enter the PAN AKSPA3663B to be registered and validate by selecting as Individual taxpayer.",
    credentialFields: [{ label: "PAN", value: "AKSPA3663B" }],
  },
  "epf-reg-18": {
    name: "EPF Reg 18 — ESIC Employer Login",
    bannerText:
      "Login to ESI portal in Simulation Experiment below using the given login credentials:\nFirm Name: Aprilia EV Motors LLP\nUser ID: 63000728280002700\nPassword: Fin@123",
    credentialFields: [
      { label: "Firm Name", value: "Aprilia EV Motors LLP" },
      { label: "User ID", value: "63000728280002700" },
      { label: "Password", value: "Fin@123" },
    ],
  },
};

const ensureKnownSimulation = async (slug) => {
  const known = KNOWN_SIMULATIONS[slug];
  if (!known) return null;
  return SimulationConfig.findOneAndUpdate(
    { slug },
    {
      $setOnInsert: {
        slug,
        name: known.name,
        ...(known.bannerText ? { bannerText: known.bannerText } : {}),
        ...(known.credentialFields
          ? { credentialFields: known.credentialFields }
          : {}),
      },
    },
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

// Admin — edit the credentials of an already-inserted simulation
export const updateOverride = async (req, res) => {
  try {
    const { slug, name, credentialFields, bannerText, requireCredentialValidation, isActive } =
      req.body;
    const update = {};
    if (slug) update.slug = String(slug).toLowerCase().trim();
    if (name !== undefined) update.name = name;
    const sanitizedFields = sanitizeCredentialFields(credentialFields);
    if (sanitizedFields !== null) update.credentialFields = sanitizedFields;
    if (bannerText !== undefined) update.bannerText = String(bannerText);
    if (requireCredentialValidation !== undefined)
      update.requireCredentialValidation = requireCredentialValidation;
    if (isActive !== undefined) update.isActive = isActive;

    const override = await SimulationOverride.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!override) {
      return res.status(404).json({ message: "Simulation override not found" });
    }
    res.json({ _id: override._id, slug: override.slug });
  } catch (error) {
    console.error("Error updating simulation override:", error);
    res.status(500).json({ message: "Failed to update simulation override" });
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
