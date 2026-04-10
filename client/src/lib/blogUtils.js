export const getApiBase = () => {
  const configuredBase =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080/api";

  const trimmed = configuredBase.trim().replace(/\/+$/, "");
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

export const getApiOrigin = () => {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/api\/?$/i, "") ||
    "http://localhost:8080";

  return configuredOrigin.trim().replace(/\/+$/, "");
};

export const getFallbackImage = (title = "") => {
  const images = [
    "/images/accounting.webp",
    "/images/course.png",
    "/images/live-class.jpg",
    "/images/student.png",
    "/images/university.png",
    "/images/vr-student.jpg",
  ];
  const hash = title.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return images[Math.abs(hash) % images.length];
};

export const extractBlogs = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.blogs)) return payload.blogs;
  if (Array.isArray(payload?.data?.blogs)) return payload.data.blogs;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};
