import { getCourseIntroMetadata, courseIntroPages } from "../courseIntroData";
import CourseIntroTemplate from "../CourseIntroTemplate";

export const metadata = getCourseIntroMetadata(
  "income-tax-certification-course"
);

export default function IncomeTaxCertificationCoursePage() {
  return (
    <CourseIntroTemplate
      content={courseIntroPages["income-tax-certification-course"]}
    />
  );
}
