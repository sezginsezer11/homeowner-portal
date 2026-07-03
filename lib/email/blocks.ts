// lib/email/blocks.ts
// Block schema for the visual email template editor.
// Stored as JSON in email_templates.design_json. Rendered to email-safe HTML at send time.

export type BlockAlign = 'left' | 'center' | 'right';

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | ColumnsBlock
  | HtmlBlock;

export interface BaseBlock { id: string; type: string; }

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  text: string;
  level: 1 | 2 | 3;
  align: BlockAlign;
  color: string;
  fontFamily: 'serif' | 'sans';
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  text: string;
  align: BlockAlign;
  color: string;
  fontSize: number;
  fontFamily: 'serif' | 'sans';
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt: string;
  width: number;             // pixel width; max equals contentWidth
  align: BlockAlign;
  href?: string;
}

export interface ButtonBlock extends BaseBlock {
  type: 'button';
  text: string;
  href: string;
  bgColor: string;
  textColor: string;
  align: BlockAlign;
  borderRadius: number;
  paddingX: number;
  paddingY: number;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  color: string;
  thickness: number;
}

export interface SpacerBlock extends BaseBlock {
  type: 'spacer';
  height: number;
}

export interface ColumnsBlock extends BaseBlock {
  type: 'columns';
  left: Block[];
  right: Block[];
  gap: number;
}

export interface HtmlBlock extends BaseBlock {
  type: 'html';
  code: string;              // raw HTML escape hatch
}

export interface Design {
  globalStyle: {
    bgColor: string;
    contentBgColor: string;
    contentWidth: number;
    fontFamily: 'serif' | 'sans';
    accentColor: string;
    textColor: string;
    linkColor: string;
  };
  blocks: Block[];
}

export const DEFAULT_DESIGN: Design = {
  globalStyle: {
    bgColor: '#fafafa',
    contentBgColor: '#ffffff',
    contentWidth: 600,
    fontFamily: 'serif',
    accentColor: '#344a57',
    textColor: '#344a57',
    linkColor: '#344a57',
  },
  blocks: [
    { id: 'b1', type: 'heading', text: 'Hello {{first_name}},', level: 1, align: 'left', color: '#344a57', fontFamily: 'serif' },
    { id: 'b2', type: 'paragraph', text: 'Your message here. Use variables like {{first_name}}, {{company}}, or {{email}} for personalization.', align: 'left', color: '#555555', fontSize: 16, fontFamily: 'serif' },
    { id: 'b3', type: 'spacer', height: 24 },
    { id: 'b4', type: 'button', text: 'Learn more', href: 'https://example.com', bgColor: '#344a57', textColor: '#ffffff', align: 'left', borderRadius: 4, paddingX: 32, paddingY: 14 },
  ],
};

export function newBlock(type: Block['type']): Block {
  const id = 'b' + Math.random().toString(36).slice(2, 9);
  switch (type) {
    case 'heading':   return { id, type, text: 'New heading',  level: 2, align: 'left', color: '#344a57', fontFamily: 'serif' };
    case 'paragraph': return { id, type, text: 'New paragraph. Click to edit.', align: 'left', color: '#555555', fontSize: 16, fontFamily: 'serif' };
    case 'image':     return { id, type, src: 'https://via.placeholder.com/600x300/344a57/ffffff?text=Image', alt: '', width: 600, align: 'center' };
    case 'button':    return { id, type, text: 'Click me', href: 'https://example.com', bgColor: '#344a57', textColor: '#ffffff', align: 'left', borderRadius: 4, paddingX: 32, paddingY: 14 };
    case 'divider':   return { id, type, color: '#e5e5e5', thickness: 1 };
    case 'spacer':    return { id, type, height: 24 };
    case 'columns':   return { id, type, gap: 20, left: [newBlock('paragraph')], right: [newBlock('paragraph')] };
    case 'html':      return { id, type, code: '<!-- raw HTML here -->' };
  }
}
