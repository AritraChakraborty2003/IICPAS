import { getCourseIntroMetadata, courseIntroPages } from "../courseIntroData";
import CourseIntroTemplate from "../CourseIntroTemplate";

export const metadata = getCourseIntroMetadata(
  "basic-accounting-and-tally-certification-course"
);

export default function BasicAccountingAndTallyCertificationCoursePage() {
  return (
    <CourseIntroTemplate
      content={
        courseIntroPages["basic-accounting-and-tally-certification-course"]
      }
    />
  );
}
