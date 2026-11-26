"use client";
import React from "react";
import {
  MdAutoAwesome,
  MdEditNote,
  MdPlaylistAdd,
  MdAutorenew,
  MdSpellcheck,
  MdWorkOutline,
  MdChildCare,
  MdUnfoldMore,
  MdShortText,
  MdTitle,
  MdFormatListBulleted,
  MdTableChart,
  MdFlag,
  MdLightbulb,
  MdBusinessCenter,
  MdQuiz,
  MdHelpOutline,
  MdTravelExplore,
  MdContentPaste,
  MdStyle,
} from "react-icons/md";
import { RibbonGroup, BigBtn, RSelect } from "../RibbonUI";

const KIND_LABEL = {
  topic: "Lesson",
  "case-study": "Case Study",
  assignment: "Assignment",
  "course-description": "Description",
  "exam-cert": "Exam Details",
  "chapter-description": "Description",
};

const TONES = ["Professional", "Friendly", "Formal", "Conversational", "Persuasive", "Simple & student-friendly", "Academic"];
const LANGS = ["Hindi", "English", "Marathi", "Gujarati", "Tamil", "Telugu", "Bengali", "Kannada", "Punjabi"];

export default function AiToolbar({ api }) {
  const ctx = api.aiContext || {};
  const run = (action, extra) => () => api.ai.run(action, extra);
  return (
    <>
      <RibbonGroup label="Generate">
        {ctx.kind && (
          <BigBtn icon={<MdAutoAwesome />} badge="AI" label={`Generate ${KIND_LABEL[ctx.kind] || "Content"}`} title="Write the complete content from the title and course context" onClick={api.ai.full} />
        )}
        <BigBtn icon={<MdAutoAwesome />} label="Write Section" title="Write a section for the selected heading / text, or the document title" onClick={run("generate")} />
        <BigBtn icon={<MdPlaylistAdd />} label="Continue Writing" onClick={run("continue")} />
      </RibbonGroup>

      <RibbonGroup label="Improve selected text">
        <BigBtn icon={<MdEditNote />} label="Rewrite" onClick={run("rewrite")} />
        <BigBtn icon={<MdSpellcheck />} label="Fix Grammar" onClick={run("grammar")} />
        <BigBtn icon={<MdWorkOutline />} label="Professional" onClick={run("professional")} />
        <BigBtn icon={<MdChildCare />} label="Simplify" onClick={run("simplify")} />
        <BigBtn icon={<MdUnfoldMore />} label="Expand" onClick={run("expand")} />
        <BigBtn icon={<MdShortText />} label="Summarize" onClick={run("summarize")} />
        <div className="flex flex-col justify-center gap-1">
          <RSelect title="Change tone" placeholder="Change tone…" value="" options={TONES} onChange={(v) => v && api.ai.run("tone", { tone: v })} className="w-[118px]" />
          <RSelect title="Translate" placeholder="Translate to…" value="" options={LANGS} onChange={(v) => v && api.ai.run("translate", { language: v })} className="w-[118px]" />
        </div>
      </RibbonGroup>

      <RibbonGroup label="Structure">
        <BigBtn icon={<MdTitle />} label="Headings" title="Add headings to the selected text" onClick={run("headings")} />
        <BigBtn icon={<MdFormatListBulleted />} label="Bullet Points" onClick={run("bullets")} />
        <BigBtn icon={<MdTableChart />} label="Table" onClick={run("table")} />
        <BigBtn icon={<MdFlag />} label="Objectives" title="Learning objectives" onClick={run("objectives")} />
      </RibbonGroup>

      <RibbonGroup label="Learning material">
        <BigBtn icon={<MdLightbulb />} label="Examples" onClick={run("examples")} />
        <BigBtn icon={<MdBusinessCenter />} label="Case Study" onClick={run("case-study")} />
        <BigBtn icon={<MdQuiz />} label="MCQs" onClick={run("mcqs", { count: 5 })} />
        <BigBtn icon={<MdQuiz />} label="Quiz (10)" onClick={run("mcqs", { count: 10 })} />
        <BigBtn icon={<MdHelpOutline />} label="FAQs" onClick={run("faqs", { count: 6 })} />
        <BigBtn icon={<MdStyle />} label="Flashcards" onClick={run("flashcards", { count: 8 })} />
      </RibbonGroup>

      <RibbonGroup label="More">
        <BigBtn icon={<MdTravelExplore />} label="SEO Optimize" onClick={run("seo")} />
        <BigBtn icon={<MdContentPaste />} label="Paste AI Output" onClick={() => api.open("pasteAi")} />
        <BigBtn icon={<MdAutorenew />} label="Repeat Last" disabled={!api.ai.last} onClick={api.ai.repeat} />
      </RibbonGroup>

      <div className="flex max-w-[210px] items-center px-3 text-[11.5px] leading-snug text-slate-500">
        Select text to rewrite or improve just that part. With nothing selected, AI uses the document title and course context. You review every result before it is added.
      </div>
    </>
  );
}
