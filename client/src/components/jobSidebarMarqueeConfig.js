import {
  BadgeCheck,
  Briefcase,
  Building2,
  Calculator,
  ChartColumn,
  FileText,
  MapPin,
  Target,
  Users,
  Wallet,
} from "lucide-react";

export const JOB_SIDEBAR_ICON_OPTIONS = [
  { id: "briefcase", label: "Briefcase", icon: Briefcase },
  { id: "building", label: "Building", icon: Building2 },
  { id: "calculator", label: "Calculator", icon: Calculator },
  { id: "fileText", label: "File Text", icon: FileText },
  { id: "badgeCheck", label: "Badge Check", icon: BadgeCheck },
  { id: "chart", label: "Chart", icon: ChartColumn },
  { id: "mapPin", label: "Map Pin", icon: MapPin },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "users", label: "Users", icon: Users },
  { id: "target", label: "Target", icon: Target },
];

export const DEFAULT_JOB_SIDEBAR_MARQUEE = {
  enabled: true,
  title: "Career Tools",
  subtitle: "Finance and accounting job essentials",
  durationSeconds: 18,
  items: [
    { icon: "briefcase", label: "Openings" },
    { icon: "building", label: "Companies" },
    { icon: "calculator", label: "Accounts" },
    { icon: "fileText", label: "CV Ready" },
    { icon: "badgeCheck", label: "Verified" },
    { icon: "chart", label: "Growth" },
  ],
};

export const getJobSidebarIconComponent = (iconId) => {
  const match = JOB_SIDEBAR_ICON_OPTIONS.find((option) => option.id === iconId);
  return match?.icon || Briefcase;
};

export const normalizeJobSidebarMarqueeSettings = (settings = {}) => {
  const items = Array.isArray(settings.items) && settings.items.length
    ? settings.items
        .map((item) => ({
          icon: item?.icon || "briefcase",
          label: item?.label || "Item",
        }))
        .slice(0, 12)
    : DEFAULT_JOB_SIDEBAR_MARQUEE.items;

  return {
    enabled:
      typeof settings.enabled === "boolean"
        ? settings.enabled
        : DEFAULT_JOB_SIDEBAR_MARQUEE.enabled,
    title: settings.title || DEFAULT_JOB_SIDEBAR_MARQUEE.title,
    subtitle: settings.subtitle || DEFAULT_JOB_SIDEBAR_MARQUEE.subtitle,
    durationSeconds:
      Number.isFinite(Number(settings.durationSeconds)) &&
      Number(settings.durationSeconds) >= 8
        ? Number(settings.durationSeconds)
        : DEFAULT_JOB_SIDEBAR_MARQUEE.durationSeconds,
    items,
  };
};
