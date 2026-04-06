import DigitalHubClient from "../../../DigitalHubClient";

export default function DemoDigitalHubCourseChapterPage({
  params,
}: {
  params: { courseSlug: string; chapterId: string };
}) {
  const { courseSlug, chapterId } = params;

  return (
    <DigitalHubClient
      courseSlugOrId={courseSlug}
      chapterId={chapterId}
      isDemo={true}
    />
  );
}
