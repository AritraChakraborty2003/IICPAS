"use client";
import React, { useState } from "react";
import { MdAutoGraph, MdDescription, MdFormatColorFill } from "react-icons/md";
import { RibbonGroup, BigBtn, MenuBtn, RSelect, ColorBtn } from "../RibbonUI";
import { INFOGRAPHICS, TEMPLATES } from "../blocks";

const Field = ({ label, children }) => (
  <div className="flex items-center gap-1.5">
    <span className="w-[86px] text-right text-[12px] text-slate-500">{label}</span>
    {children}
  </div>
);

export default function DesignToolbar({ api }) {
  const [sectionBg, setSectionBg] = useState("#eff6ff");
  const [pageBg, setPageBg] = useState("#ffffff");
  const doc = api.docSettings;

  return (
    <>
      <RibbonGroup label="Infographics">
        <MenuBtn icon={<MdAutoGraph />} label="Infographic" items={Object.entries(INFOGRAPHICS).map(([k, v]) => ({ label: v.label, icon: v.icon, onClick: () => api.openInfographic(k) }))} />
        <div className="grid grid-cols-6 gap-x-0.5">
          {Object.entries(INFOGRAPHICS).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => api.openInfographic(k)}
              title={`${v.label} infographic`}
              className="flex w-[52px] flex-col items-center rounded px-1 py-0.5 text-[11px] text-slate-700 hover:bg-blue-50"
            >
              <span className="text-[15px] text-blue-600">{v.icon}</span>
              {v.label}
            </button>
          ))}
        </div>
      </RibbonGroup>

      <RibbonGroup label="Selected block">
        <div className="flex flex-col gap-1">
          <Field label="Box style">
            <RSelect title="Box style" placeholder="Choose…" value="" className="w-[120px]"
              options={[["none", "None"], ["card", "Card (shadow)"], ["bordered", "Bordered"], ["tinted", "Tinted"], ["accent", "Accent bar"], ["highlight", "Highlight"]]}
              onChange={(v) => v && api.styleBlock("box", v)} />
          </Field>
          <Field label="Animation">
            <RSelect title="Animation" placeholder="Choose…" value="" className="w-[120px]"
              options={[["none", "None"], ["fade", "Fade in"], ["slide", "Slide up"], ["zoom", "Zoom in"]]}
              onChange={(v) => v && api.styleBlock("anim", v)} />
          </Field>
          <Field label="Border">
            <RSelect title="Border" placeholder="Choose…" value="" className="w-[92px]"
              options={[["none", "None"], ["1px solid #cbd5e1", "Thin"], ["2px solid #2563eb", "Blue"], ["2px dashed #94a3b8", "Dashed"], ["3px double #334155", "Double"]]}
              onChange={(v) => v && api.styleBlock("border", v)} />
            <ColorBtn icon={<MdFormatColorFill />} title="Block background colour" value={sectionBg} onChange={(c) => { setSectionBg(c); api.styleBlock("background", c); }} />
          </Field>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Pictures & tables">
        <div className="flex flex-col gap-1">
          <Field label="Image size">
            <RSelect title="Image size" placeholder="Choose…" value="" className="w-[110px]" options={["25", "33", "50", "75", "100"].map((w) => [w, `${w}%`])} onChange={(v) => v && api.imageStyle("width", v)} />
          </Field>
          <Field label="Image position">
            <RSelect title="Image position" placeholder="Choose…" value="" className="w-[110px]"
              options={[["center", "Centre"], ["left", "Wrap left"], ["right", "Wrap right"], ["inline", "Inline"]]}
              onChange={(v) => v && api.imageStyle("position", v)} />
          </Field>
          <Field label="Table style">
            <RSelect title="Table style" placeholder="Choose…" value="" className="w-[110px]"
              options={[["ce-table-striped", "Striped"], ["ce-table-bordered", "Bordered"], ["ce-table-minimal", "Minimal"], ["ce-table-header ce-table-striped", "Coloured header"], ["ce-table-compact", "Compact"], ["", "Plain"]]}
              onChange={(v) => api.tableStyle(v)} />
          </Field>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Document">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <Field label="Theme">
            <RSelect title="Document theme" value={doc.theme || "blue"} className="w-[100px]"
              options={[["blue", "IICPA Blue"], ["green", "Green"], ["purple", "Purple"], ["warm", "Warm"], ["slate", "Slate"]]}
              onChange={(v) => api.setDocSetting("theme", v)} />
          </Field>
          <Field label="Content width">
            <RSelect title="Content width" value={doc.width || "full"} className="w-[100px]"
              options={[["full", "Full"], ["wide", "Wide"], ["standard", "Standard"], ["narrow", "Narrow"]]}
              onChange={(v) => api.setDocSetting("width", v)} />
          </Field>
          <Field label="Headings">
            <RSelect title="Heading style" value={doc.headings || "plain"} className="w-[100px]"
              options={[["plain", "Plain"], ["accent", "Accent bar"], ["underline", "Underline"], ["banner", "Banner"]]}
              onChange={(v) => api.setDocSetting("headings", v)} />
          </Field>
          <Field label="Margins">
            <RSelect title="Margins" value={doc.padding || "0"} className="w-[100px]"
              options={[["0", "None"], ["12px", "Narrow"], ["24px", "Normal"], ["40px", "Wide"]]}
              onChange={(v) => api.setDocSetting("padding", v)} />
          </Field>
          <Field label="Page size">
            <RSelect title="Page size (printing)" value={doc.page || "auto"} className="w-[100px]"
              options={[["auto", "Screen"], ["a4", "A4"], ["letter", "Letter"]]}
              onChange={(v) => api.setDocSetting("page", v)} />
          </Field>
          <Field label="Background">
            <ColorBtn icon={<MdFormatColorFill />} title="Page background colour" value={pageBg} onChange={(c) => { setPageBg(c); api.setDocSetting("background", c); }} />
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => api.setDocSetting("background", "")} className="text-[11px] text-blue-600">reset</button>
          </Field>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Layout">
        <MenuBtn
          icon={<MdDescription />}
          label="Templates"
          items={Object.entries(TEMPLATES).map(([k, t]) => ({ label: `${t.label} template`, onClick: () => api.insertTemplate(k) }))}
        />
        <MenuBtn
          icon="⎔"
          label="Header/Footer"
          items={[
            { label: "Add / edit header", onClick: () => api.headerFooter("header") },
            { label: "Add / edit footer", onClick: () => api.headerFooter("footer") },
            "-",
            { label: "Remove header", onClick: () => api.headerFooter("header", true) },
            { label: "Remove footer", onClick: () => api.headerFooter("footer", true) },
          ]}
        />
        <BigBtn icon="↺" label="Reset design" title="Remove document theme, width and background" onClick={api.resetDocSettings} />
      </RibbonGroup>
    </>
  );
}
