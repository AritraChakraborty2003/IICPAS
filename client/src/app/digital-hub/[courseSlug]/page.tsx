import dynamic from "next/dynamic";

const DigitalHubClient = dynamic(() => import("../DigitalHubClient"), {
  ssr: false,
});

export default function DigitalHubCoursePage({
  params,
}: {
  params: { courseSlug: string };
}) {
  const { courseSlug } = params;

  return <DigitalHubClient courseSlugOrId={courseSlug} isDemo={false} />;
}
