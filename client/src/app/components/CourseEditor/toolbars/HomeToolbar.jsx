"use client";
import React, { useState } from "react";
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdStrikethroughS,
  MdSuperscript,
  MdSubscript,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatIndentIncrease,
  MdFormatIndentDecrease,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
  MdLink,
  MdLinkOff,
  MdFormatQuote,
  MdFormatPaint,
  MdFormatClear,
  MdFormatColorText,
  MdBorderColor,
  MdTextIncrease,
  MdTextDecrease,
} from "react-icons/md";
import { RibbonGroup, BigBtn, IconBtn, StyleTile, RSelect, ColorBtn } from "../RibbonUI";

const FONTS = [
  ['"Roboto", sans-serif', "Roboto"],
  ["Arial, Helvetica, sans-serif", "Arial"],
  ["Georgia, Palatino, serif", "Georgia"],
  ["'Times New Roman', Times, serif", "Times New Roman"],
  ["Tahoma, Geneva, sans-serif", "Tahoma"],
  ["Verdana, Geneva, sans-serif", "Verdana"],
  ["'Trebuchet MS', Helvetica, sans-serif", "Trebuchet MS"],
  ["'Courier New', Courier, monospace", "Courier New"],
];
const SIZES = ["10", "12", "14", "15", "16", "18", "20", "24", "28", "32", "36", "48"];
const LINE_HEIGHTS = [["1", "1.0"], ["1.15", "1.15"], ["1.5", "1.5"], ["1.75", "1.75"], ["2", "2.0"]];
const PARA_SPACING = [["0.25em", "Compact"], ["0.75em", "Normal"], ["1.25em", "Relaxed"], ["2em", "Extra"]];

export default function HomeToolbar({ api }) {
  const [color, setColor] = useState("#1d4ed8");
  const [highlight, setHighlight] = useState("#fde68a");
  const st = api.formatState;

  const changeCase = (mode) => {
    const text = api.selectionText();
    if (!text) return api.notify("Select some text first.", "info");
    const out =
      mode === "upper" ? text.toUpperCase() : mode === "lower" ? text.toLowerCase() : text.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());
    api.insertText(out);
  };

  return (
    <>
      <RibbonGroup label="Clipboard">
        <BigBtn icon={<MdFormatPaint />} label="Format Painter" active={api.painterActive} onClick={api.startPainter} title="Copy formatting from the cursor and apply it to the next selection" />
        <BigBtn icon={<MdFormatClear />} label="Clear Format" onClick={api.clearFormat} />
      </RibbonGroup>

      <RibbonGroup label="Font">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <RSelect title="Font" placeholder="Font" value="" options={FONTS} onChange={(v) => v && api.exec("fontname", v)} className="w-[132px]" />
            <RSelect title="Size" placeholder="Size" value="" options={SIZES.map((s) => [s, s])} onChange={(v) => v && api.exec("fontsize", `${v}px`)} className="w-[70px]" />
            <IconBtn icon={<MdTextIncrease />} title="Increase font size" onClick={() => api.stepFontSize(2)} />
            <IconBtn icon={<MdTextDecrease />} title="Decrease font size" onClick={() => api.stepFontSize(-2)} />
          </div>
          <div className="flex items-center gap-0.5">
            <IconBtn icon={<MdFormatBold />} title="Bold (Ctrl+B)" active={st.bold} onClick={() => api.exec("bold")} />
            <IconBtn icon={<MdFormatItalic />} title="Italic (Ctrl+I)" active={st.italic} onClick={() => api.exec("italic")} />
            <IconBtn icon={<MdFormatUnderlined />} title="Underline (Ctrl+U)" active={st.underline} onClick={() => api.exec("underline")} />
            <IconBtn icon={<MdStrikethroughS />} title="Strikethrough" active={st.strike} onClick={() => api.exec("strikethrough")} />
            <IconBtn icon={<MdSuperscript />} title="Superscript" active={st.sup} onClick={() => api.exec("superscript")} />
            <IconBtn icon={<MdSubscript />} title="Subscript" active={st.sub} onClick={() => api.exec("subscript")} />
            <RSelect title="Change case" placeholder="Aa" value="" options={[["upper", "UPPERCASE"], ["lower", "lowercase"], ["title", "Title Case"]]} onChange={(v) => v && changeCase(v)} className="w-[58px]" />
            <ColorBtn icon={<MdFormatColorText />} title="Font colour" value={color} onChange={(c) => { setColor(c); api.exec("forecolor", c); }} />
            <ColorBtn icon={<MdBorderColor />} title="Text highlight colour" value={highlight} onChange={(c) => { setHighlight(c); api.exec("background", c); }} />
          </div>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Paragraph">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-0.5">
            <IconBtn icon={<MdFormatListBulleted />} title="Bulleted list" active={st.ul} onClick={() => api.exec("insertUnorderedList")} />
            <IconBtn icon={<MdFormatListNumbered />} title="Numbered list" active={st.ol} onClick={() => api.exec("insertOrderedList")} />
            <IconBtn icon={<MdFormatIndentDecrease />} title="Decrease indent" onClick={() => api.exec("outdent")} />
            <IconBtn icon={<MdFormatIndentIncrease />} title="Increase indent" onClick={() => api.exec("indent")} />
            <RSelect title="Line spacing" placeholder="Spacing" value="" options={LINE_HEIGHTS} onChange={(v) => v && api.setLineHeight(v)} className="w-[86px]" />
          </div>
          <div className="flex items-center gap-0.5">
            <IconBtn icon={<MdFormatAlignLeft />} title="Align left" active={st.align === "left"} onClick={() => api.exec("justifyleft")} />
            <IconBtn icon={<MdFormatAlignCenter />} title="Centre" active={st.align === "center"} onClick={() => api.exec("justifycenter")} />
            <IconBtn icon={<MdFormatAlignRight />} title="Align right" active={st.align === "right"} onClick={() => api.exec("justifyright")} />
            <IconBtn icon={<MdFormatAlignJustify />} title="Justify" active={st.align === "justify"} onClick={() => api.exec("justifyfull")} />
            <IconBtn icon={<MdLink />} title="Insert link" onClick={() => api.open("link")} />
            <IconBtn icon={<MdLinkOff />} title="Remove link" onClick={api.unlink} />
            <IconBtn icon={<MdFormatQuote />} title="Quote" onClick={() => api.formatBlock("blockquote")} />
            <RSelect title="Paragraph spacing" placeholder="¶ Space" value="" options={PARA_SPACING} onChange={(v) => v && api.setParagraphSpacing(v)} className="w-[86px]" />
          </div>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Styles">
        <div className="flex items-center gap-1.5">
          <StyleTile label="Title" title="Heading 1" className="text-[19px] font-extrabold" onClick={() => api.formatBlock("h1")} />
          <StyleTile label="Heading" title="Heading 2" className="text-[17px] font-bold" onClick={() => api.formatBlock("h2")} />
          <StyleTile label="Sub-heading" title="Heading 3" className="text-[15px] font-semibold" onClick={() => api.formatBlock("h3")} />
          <StyleTile label="Normal text" title="Paragraph" className="text-[13px]" onClick={() => api.formatBlock("p")} />
        </div>
      </RibbonGroup>
    </>
  );
}
