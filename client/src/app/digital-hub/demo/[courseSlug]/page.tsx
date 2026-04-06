import dynamic from "next/dynamic";

const DigitalHubClient = dynamic(() => import("../../DigitalHubClient"), {
  ssr: false,
});

export default function DemoDigitalHubCoursePage({
  params,
}: {
  params: { courseSlug: string };
}) {
  const { courseSlug } = params;

  return <DigitalHubClient courseSlugOrId={courseSlug} isDemo={true} />;
}
