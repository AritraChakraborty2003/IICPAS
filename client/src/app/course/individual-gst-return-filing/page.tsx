import { getCourseIntroMetadata, courseIntroPages } from "../courseIntroData";
import CourseIntroTemplate from "../CourseIntroTemplate";

export const metadata = getCourseIntroMetadata("individual-gst-return-filing");

export default function IndividualGstReturnFilingPage() {
  return (
    <CourseIntroTemplate
      content={courseIntroPages["individual-gst-return-filing"]}
    />
  );
}
