"use client";
import React from "react";
import { RibbonGroup, BigBtn } from "../RibbonUI";
import { IA_BLOCKS } from "../blocks";

const GROUPS = [
  ["Questions", ["mcq", "@ai-mcqs", "quiz", "truefalse", "multiselect"]],
  ["Practice", ["fill", "match", "order", "exercise", "activity"]],
  ["Explore", ["flip", "flashcards", "accordion", "tabs", "reveal", "steps", "worked", "mistakes"]],
  ["Tools", ["calculator", "chart", "resources", "@ai-flashcards"]],
];

export default function InteractiveToolbar({ api }) {
  return (
    <>
      {GROUPS.map(([label, keys]) => (
        <RibbonGroup key={label} label={label}>
          {keys.map((k) => {
            if (k === "@ai-mcqs") {
              return <BigBtn key={k} icon="🤖" label="AI MCQs" badge="AI" title="Generate MCQs from the selected text or this document with AI" onClick={() => api.ai.run("mcqs")} />;
            }
            if (k === "@ai-flashcards") {
              return <BigBtn key={k} icon="🤖" label="AI Flashcards" badge="AI" title="Generate flashcards with AI" onClick={() => api.ai.run("flashcards")} />;
            }
            const b = IA_BLOCKS[k];
            return <BigBtn key={k} icon={b.icon} label={b.label} onClick={() => api.openBlock(k)} />;
          })}
        </RibbonGroup>
      ))}
      <div className="flex max-w-[180px] items-center px-3 text-[11.5px] leading-snug text-slate-500">
        Tip: double-click any interactive block in the document to edit it. Students can answer them in the Student Portal.
      </div>
    </>
  );
}
