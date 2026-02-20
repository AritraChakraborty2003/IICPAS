import DigitalHubClient from "../../DigitalHubClient";

export default async function DemoDigitalHubCoursePage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;

  return <DigitalHubClient courseSlugOrId={courseSlug} isDemo={true} />;
}
