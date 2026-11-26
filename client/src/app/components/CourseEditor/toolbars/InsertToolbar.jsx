"use client";
import React from "react";
import {
  MdTextFields,
  MdViewColumn,
  MdFormatQuote,
  MdTableChart,
  MdImage,
  MdAddPhotoAlternate,
  MdOndemandVideo,
  MdAudiotrack,
  MdAttachFile,
  MdCode,
  MdWeb,
  MdFunctions,
  MdScience,
  MdEmojiSymbols,
  MdCategory,
  MdSmartButton,
  MdLink,
  MdBookmark,
  MdDownload,
  MdBarChart,
  MdHorizontalRule,
  MdHeight,
  MdInsertPageBreak,
} from "react-icons/md";
import { FaCode } from "react-icons/fa";
import { RibbonGroup, BigBtn, MenuBtn, RSelect } from "../RibbonUI";
import { CALLOUTS, calloutHtml, columnsHtml, SHAPES, chemistryHtml } from "../blocks";
import { esc, isSafeUrl } from "../editorCore";

export default function InsertToolbar({ api }) {
  const inTable = !!api.formatState.inTable;

  const insertCallout = (kind) => {
    const sel = api.selectionHtml();
    api.insertHTML(calloutHtml(kind, sel ? sel : ""));
  };

  const insertButton = () =>
    api.form({
      title: "Insert button",
      fields: [
        { name: "text", label: "Button text", type: "text", required: true },
        { name: "url", label: "Link (https://…)", type: "text", required: true },
      ],
      initial: { text: api.selectionText() || "Open", url: "" },
      validate: (c) => (!isSafeUrl(c.url) ? "Enter a valid http(s) link." : ""),
      onSubmit: (c) => api.insertHTML(`<p><a class="ce-btn" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.text)}</a></p>`),
    });

  const insertChemistry = () =>
    api.form({
      title: "Chemical formula",
      fields: [{ name: "formula", label: "Formula - numbers become subscripts, ^2+ becomes superscript (e.g. H2SO4, Fe^3+, CO2 -> C + O2)", type: "text", required: true }],
      initial: { formula: api.selectionText() },
      onSubmit: (c) => api.insertHTML(chemistryHtml(c.formula)),
    });

  const insertStats = () =>
    api.form({
      title: "Key figures",
      fields: [{ name: "items", label: "One per line as  Value | Label", type: "textarea", rows: 5, required: true }],
      initial: { items: "18% | Standard GST rate\n₹40 lakh | Registration threshold (goods)\n20th | GSTR-3B due date" },
      onSubmit: (c) => {
        const items = String(c.items).split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0]);
        api.insertHTML(
          `<div class="ce-cols ce-cols-${Math.min(3, items.length) || 1}">${items
            .map(([v, l]) => `<div class="ce-col ce-style-tinted" style="text-align:center"><p style="font-size:1.8em;font-weight:800;margin:0">${esc(v)}</p><p style="margin:0">${esc(l || "")}</p></div>`)
            .join("")}</div><p><br></p>`
        );
      },
    });

  return (
    <>
      <RibbonGroup label="Text blocks">
        <BigBtn icon={<MdTextFields />} label="Text" title="Insert a new paragraph" onClick={() => api.insertHTML("<p>Write your text here…</p>")} />
        <MenuBtn icon={<MdViewColumn />} label="Columns" items={[{ label: "Two columns", onClick: () => api.insertHTML(columnsHtml(2)) }, { label: "Three columns", onClick: () => api.insertHTML(columnsHtml(3)) }]} />
        <BigBtn icon={<MdFormatQuote />} label="Quote" onClick={() => api.formatBlock("blockquote")} />
        <div className="self-center">
          <RSelect title="Note box" placeholder="Note box" value="" options={Object.entries(CALLOUTS).map(([k, v]) => [k, `${v.icon} ${v.label}`])} onChange={(v) => v && insertCallout(v)} className="w-[124px]" />
        </div>
      </RibbonGroup>

      <RibbonGroup label="Tables">
        <MenuBtn
          icon={<MdTableChart />}
          label="Table"
          items={[
            { label: "Insert table…", icon: "▦", onClick: () => api.open("table") },
            "-",
            { label: "Insert row above", disabled: !inTable, onClick: () => api.tableOp("rowAbove") },
            { label: "Insert row below", disabled: !inTable, onClick: () => api.tableOp("rowBelow") },
            { label: "Insert column left", disabled: !inTable, onClick: () => api.tableOp("colLeft") },
            { label: "Insert column right", disabled: !inTable, onClick: () => api.tableOp("colRight") },
            "-",
            { label: "Delete row", disabled: !inTable, onClick: () => api.tableOp("deleteRow") },
            { label: "Delete column", disabled: !inTable, onClick: () => api.tableOp("deleteCol") },
            { label: "Toggle header row", disabled: !inTable, onClick: () => api.tableOp("toggleHeader") },
            { label: "Delete table", disabled: !inTable, onClick: () => api.tableOp("deleteTable") },
          ]}
        />
      </RibbonGroup>

      <RibbonGroup label="Media">
        <div className="grid grid-cols-4 gap-x-0.5">
          <BigBtn icon={<MdImage />} label="Image" title="Upload an image" onClick={() => api.open("media", { kind: "image" })} />
          <BigBtn icon={<MdAddPhotoAlternate />} label="Image URL" onClick={() => api.open("media", { kind: "image", source: "url" })} />
          <BigBtn icon={<MdOndemandVideo />} label="Video" onClick={() => api.open("media", { kind: "video" })} />
          <BigBtn icon={<MdAudiotrack />} label="Audio" onClick={() => api.open("media", { kind: "audio" })} />
          <BigBtn icon={<MdAttachFile />} label="File" title="Downloadable attachment" onClick={() => api.open("media", { kind: "file" })} />
          <BigBtn icon={<FaCode />} label="Web page" title="Link card to a web page" onClick={() => api.open("media", { kind: "webpage" })} />
          <BigBtn icon={<MdWeb />} label="Embed" title="Embed a page (iframe)" onClick={() => api.open("media", { kind: "embed" })} />
        </div>
      </RibbonGroup>

      <RibbonGroup label="Functions & symbols">
        <BigBtn icon={<MdFunctions />} label="Equation" onClick={() => api.open("equation")} />
        <BigBtn icon={<MdScience />} label="Chemistry" onClick={insertChemistry} />
        <BigBtn icon={<MdEmojiSymbols />} label="Symbol" onClick={() => api.open("symbol")} />
        <BigBtn icon={<MdCode />} label="Code" onClick={() => api.open("code", { initialCode: api.selectionText() })} />
      </RibbonGroup>

      <RibbonGroup label="Shapes & links">
        <MenuBtn icon={<MdCategory />} label="Shapes" items={Object.values(SHAPES).map((s) => ({ label: s.label, onClick: () => api.insertHTML(s.html) }))} />
        <BigBtn icon={<MdSmartButton />} label="Button" onClick={insertButton} />
        <BigBtn icon={<MdLink />} label="Hyperlink" onClick={() => api.open("link")} />
        <BigBtn icon={<MdBookmark />} label="Internal Link" title="Link to a heading in this document" onClick={() => api.open("link", { mode: "internal" })} />
        <BigBtn icon={<MdDownload />} label="Download Card" onClick={() => api.open("media", { kind: "file" })} />
        <MenuBtn
          icon={<MdBarChart />}
          label="Data Blocks"
          items={[
            { label: "Bar chart", icon: "📊", onClick: () => api.openBlock("chart") },
            { label: "Key figures", icon: "🔢", onClick: insertStats },
          ]}
        />
      </RibbonGroup>

      <RibbonGroup label="Breaks">
        <div className="flex flex-col items-start gap-0.5 py-0.5">
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => api.exec("insertHorizontalRule")} className="flex items-center gap-2 rounded px-2 py-1 text-[12.5px] text-slate-700 hover:bg-blue-50"><MdHorizontalRule className="text-blue-600" /> Divider</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => api.insertHTML('<div class="ce-spacer"><br></div>')} className="flex items-center gap-2 rounded px-2 py-1 text-[12.5px] text-slate-700 hover:bg-blue-50"><MdHeight className="text-blue-600" /> Spacer</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => api.insertHTML('<div class="ce-page-break" contenteditable="false"></div><p><br></p>')} className="flex items-center gap-2 rounded px-2 py-1 text-[12.5px] text-slate-700 hover:bg-blue-50"><MdInsertPageBreak className="text-blue-600" /> Page break</button>
        </div>
      </RibbonGroup>
    </>
  );
}
