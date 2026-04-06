"use client";

import DigitalHubClient from "../../DigitalHubClient";

export default function DemoDigitalHubCoursePage({
  params,
}: {
  params: { courseSlug: string };
}) {
  const { courseSlug } = params;

  return <DigitalHubClient courseSlugOrId={courseSlug} isDemo={true} />;
}
