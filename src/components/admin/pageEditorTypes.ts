export type BlockType = "heading" | "paragraph" | "image" | "cta" | "divider" | "two-col" | "callout" | "html";

export interface Block {
  id: string;
  type: BlockType;
  data: Record<string, string>;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: Block[];
  status: string;
  show_in_menu: boolean;
  meta_title: string;
  meta_desc: string;
  og_image: string;
}
