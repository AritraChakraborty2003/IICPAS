import DigitalHubClient from "../../../DigitalHubClient";

export default async function DemoDigitalHubCourseChapterPage({
  params,
}: {
  params: Promise<{ courseSlug: string; chapterId: string }>;
}) {
  const { courseSlug, chapterId } = await params;

  return (
    <DigitalHubClient
      courseSlugOrId={courseSlug}
      chapterId={chapterId}
      isDemo={true}
    />
  );
}
