"use client";
import React from "react";
import {
  MdFindReplace,
  MdCleaningServices,
  MdIntegrationInstructions,
  MdSlideshow,
  MdVisibility,
  MdSpellcheck,
  MdGrading,
  MdMenuBook,
  MdHistory,
  MdComment,
  MdQueryStats,
} from "react-icons/md";
import { RibbonGroup, BigBtn } from "../RibbonUI";

export default function ReviewToolbar({ api }) {
  return (
    <>
      <RibbonGroup label="Tidy">
        <BigBtn icon={<MdFindReplace />} label="Find & Replace" onClick={() => api.open("find")} />
        <BigBtn icon={<MdCleaningServices />} label="Clean Up" title="Remove empty paragraphs, pasted Word styles and stray formatting" onClick={api.cleanUp} />
        <BigBtn icon={<MdIntegrationInstructions />} label="Format Code" title="View / edit the HTML source" onClick={() => api.open("source")} />
      </RibbonGroup>
      <RibbonGroup label="Preview">
        <BigBtn icon={<MdSlideshow />} label="Present" onClick={() => api.open("present")} />
        <BigBtn icon={<MdVisibility />} label="Student View" onClick={api.preview} />
      </RibbonGroup>
      <RibbonGroup label="Proofing">
        <BigBtn icon={<MdSpellcheck />} label={api.spellcheck ? "Spelling: On" : "Spelling: Off"} active={api.spellcheck} title="Underline misspelt words (browser spell check)" onClick={api.toggleSpellcheck} />
        <BigBtn icon={<MdGrading />} label="Grammar & Spelling" badge="AI" title="Spelling, grammar and punctuation check with AI" onClick={() => api.open("review", { focus: "all", autoRun: true })} />
        <BigBtn icon={<MdMenuBook />} label="Readability" onClick={() => api.open("review", { focus: "readability" })} />
        <BigBtn icon={<MdQueryStats />} label="Word Count" onClick={() => api.open("review", { focus: "readability" })} />
      </RibbonGroup>
      <RibbonGroup label="Tracking">
        <BigBtn icon={<MdHistory />} label="History" onClick={() => api.open("history")} />
        <BigBtn icon={<MdComment />} label="Review Notes" onClick={() => api.open("notes")} />
      </RibbonGroup>
    </>
  );
}
