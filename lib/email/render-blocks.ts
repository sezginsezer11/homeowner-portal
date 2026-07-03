// lib/email/render-blocks.ts
// Converts a Design (block tree) into email-safe HTML.
// Uses tables + inline CSS for Outlook compatibility.

import type { Block, Design } from './blocks';

const FONT_STACKS = {
  serif: "Georgia, 'Times New Roman', Times, serif",
  sans:  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;

const escHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Preserve newlines + {{variable}} placeholders (left intact — substituted at send time).
const renderText = (s: string) => escHtml(s).replace(/\n/g, '<br>');

function renderBlock(b: Block, design: Design, columnWidth?: number): string {
  switch (b.type) {
    case 'heading': {
      const ff = FONT_STACKS[b.fontFamily || 'serif'];
      const size = b.level === 1 ? 28 : b.level === 2 ? 22 : 18;
      const lh = b.level === 1 ? 1.2 : 1.3;
      return `<tr><td align="${b.align}" style="padding:12px 0;font-family:${ff};font-size:${size}px;line-height:${lh};color:${b.color};font-weight:bold">${renderText(b.text)}</td></tr>`;
    }
    case 'paragraph': {
      const ff = FONT_STACKS[b.fontFamily || 'serif'];
      return `<tr><td align="${b.align}" style="padding:8px 0;font-family:${ff};font-size:${b.fontSize}px;line-height:1.6;color:${b.color}">${renderText(b.text)}</td></tr>`;
    }
    case 'image': {
      const w = Math.min(b.width, columnWidth || design.globalStyle.contentWidth);
      const img = `<img src="${escHtml(b.src)}" alt="${escHtml(b.alt)}" width="${w}" style="display:block;border:0;outline:none;text-decoration:none;width:${w}px;max-width:100%;height:auto">`;
      const wrapped = b.href ? `<a href="${escHtml(b.href)}" style="text-decoration:none">${img}</a>` : img;
      return `<tr><td align="${b.align}" style="padding:8px 0">${wrapped}</td></tr>`;
    }
    case 'button': {
      // Bulletproof button (table-based for Outlook)
      const ff = FONT_STACKS[design.globalStyle.fontFamily];
      return `<tr><td align="${b.align}" style="padding:12px 0">
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%">
          <tr><td align="center" bgcolor="${b.bgColor}" role="presentation" style="border-radius:${b.borderRadius}px;background-color:${b.bgColor}">
            <a href="${escHtml(b.href)}" target="_blank" style="background-color:${b.bgColor};border-radius:${b.borderRadius}px;color:${b.textColor};display:inline-block;font-family:${ff};font-size:15px;font-weight:bold;line-height:120%;padding:${b.paddingY}px ${b.paddingX}px;text-decoration:none;text-transform:none">${escHtml(b.text)}</a>
          </td></tr>
        </table>
      </td></tr>`;
    }
    case 'divider': {
      return `<tr><td style="padding:16px 0"><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="border-top:${b.thickness}px solid ${b.color};font-size:1px;line-height:1px">&nbsp;</td></tr></table></td></tr>`;
    }
    case 'spacer': {
      return `<tr><td style="height:${b.height}px;font-size:1px;line-height:${b.height}px">&nbsp;</td></tr>`;
    }
    case 'columns': {
      const colW = Math.floor((design.globalStyle.contentWidth - b.gap) / 2);
      const inner = (blocks: Block[]) =>
        `<table width="${colW}" cellpadding="0" cellspacing="0" role="presentation" style="width:${colW}px;max-width:${colW}px">
          ${blocks.map(child => renderBlock(child, design, colW)).join('')}
        </table>`;
      return `<tr><td>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
          <td valign="top" width="${colW}" style="padding-right:${b.gap/2}px">${inner(b.left)}</td>
          <td valign="top" width="${colW}" style="padding-left:${b.gap/2}px">${inner(b.right)}</td>
        </tr></table>
      </td></tr>`;
    }
    case 'html': {
      // Wrap raw HTML in a row so it sits in the table flow
      return `<tr><td>${b.code}</td></tr>`;
    }
  }
}

export function renderDesignToHtml(design: Design, subjectPreheader?: { subject?: string; preheader?: string }): string {
  const g = design.globalStyle;
  const ff = FONT_STACKS[g.fontFamily];
  const preheader = subjectPreheader?.preheader || '';

  const inner = design.blocks.map(b => renderBlock(b, design)).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${escHtml(subjectPreheader?.subject || '')}</title>
<style>
  /* Mobile */
  @media only screen and (max-width:620px) {
    .container { width:100% !important; max-width:100% !important; }
    .px { padding-left:24px !important; padding-right:24px !important; }
  }
  a { color: ${g.linkColor}; }
</style>
</head>
<body style="margin:0;padding:0;background-color:${g.bgColor};font-family:${ff};color:${g.textColor}">
  ${preheader ? `<div style="display:none;font-size:1px;color:${g.bgColor};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escHtml(preheader)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${g.bgColor}">
    <tr><td align="center" style="padding:40px 16px">
      <table role="presentation" class="container" width="${g.contentWidth}" cellpadding="0" cellspacing="0" border="0" style="width:${g.contentWidth}px;max-width:${g.contentWidth}px;background-color:${g.contentBgColor}">
        <tr><td class="px" style="padding:40px 40px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${inner}
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
  {{tracking_pixel}}
</body></html>`;
}
