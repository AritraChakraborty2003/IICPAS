import DigitalHubClient from "../DigitalHubClient";

export default async function DigitalHubCoursePage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;

  return <DigitalHubClient courseSlugOrId={courseSlug} isDemo={false} />;
}
