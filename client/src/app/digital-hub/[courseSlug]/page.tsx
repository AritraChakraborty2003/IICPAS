import DigitalHubClient from "../DigitalHubClient";

export default function DigitalHubCoursePage({
  params,
}: {
  params: { courseSlug: string };
}) {
  const { courseSlug } = params;

  return <DigitalHubClient courseSlugOrId={courseSlug} isDemo={false} />;
}
