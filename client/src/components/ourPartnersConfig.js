export const DEFAULT_OUR_PARTNERS_SETTINGS = {
  enabled: true,
  title: "Our Partners",
  durationSeconds: 18,
  items: [
    { name: "Triostack", logoUrl: "" },
    { name: "Industry Network", logoUrl: "" },
    { name: "Hiring Partners", logoUrl: "" },
    { name: "Placement Ecosystem", logoUrl: "" },
    { name: "Training Alliances", logoUrl: "" },
    { name: "Business Collaborators", logoUrl: "" },
  ],
};

export const normalizeOurPartnersSettings = (settings = {}) => {
  const items = Array.isArray(settings.items)
    ? settings.items
        .map((item) => ({
          name: typeof item?.name === "string" ? item.name.trim() : "",
          logoUrl:
            typeof item?.logoUrl === "string" ? item.logoUrl.trim() : "",
        }))
        .filter((item) => item.name)
        .slice(0, 20)
    : [];

  return {
    enabled:
      typeof settings.enabled === "boolean"
        ? settings.enabled
        : DEFAULT_OUR_PARTNERS_SETTINGS.enabled,
    title:
      typeof settings.title === "string" && settings.title.trim()
        ? settings.title.trim()
        : DEFAULT_OUR_PARTNERS_SETTINGS.title,
    durationSeconds:
      Number.isFinite(Number(settings.durationSeconds)) &&
      Number(settings.durationSeconds) >= 8
        ? Math.min(60, Number(settings.durationSeconds))
        : DEFAULT_OUR_PARTNERS_SETTINGS.durationSeconds,
    items: items.length ? items : DEFAULT_OUR_PARTNERS_SETTINGS.items,
  };
};
