// Shared writing style for every AI-generated title and heading (course,
// chapter, topic, assignment, quiz, explanations, SEO fields).

export const EDUCATIONAL_TITLE_STYLE = `Educational title style (titles and headings):
- Use descriptive, professional noun-phrase titles, not question-style or chatty headings.
- Avoid -> Prefer:
  "What is Power BI?" -> "Overview of Power BI"
  "What is GST?" -> "Introduction to Goods and Services Tax"
  "What is TDS?" -> "Understanding Tax Deducted at Source"
  "How to Use Excel?" -> "Practical Applications of Microsoft Excel"
  "What is Tally?" -> "Introduction to TallyPrime"
  "What is a Balance Sheet?" -> "Understanding the Structure of a Balance Sheet"
  "How to File GST Returns?" -> "Practical Guide to GST Return Filing"
  "What is Accounting?" -> "Fundamentals of Financial Accounting"
  "How to Create a Dashboard?" -> "Interactive Dashboard Development"
  "What is Income Tax?" -> "Fundamentals of Income Taxation"
  "How to Make an Invoice?" -> "Preparation of Professional Tax Invoices"
  "What is Power Query?" -> "Introduction to Data Transformation Using Power Query"
- Keep keywords natural (no stuffing), use Title Case, no emojis, no exclamation marks, no clickbait.
- Quiz QUESTIONS are the exception: they keep natural interrogative wording.`;

// Question-style titles that the validator flags ("What is GST?", "How to ...")
export const isQuestionStyleTitle = (title = "") =>
  /^\s*(what|how|why|when|where|which|who)\b/i.test(title) || /\?\s*$/.test(title);
