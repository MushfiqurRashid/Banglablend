type PortableTextSpan = {
  _type?: string;
  text?: unknown;
};

type PortableTextBlock = {
  _type?: string;
  children?: unknown;
};

export function portableTextToPlainText(value: unknown): string {
  if (!Array.isArray(value)) return typeof value === "string" ? value : "";

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const block = item as PortableTextBlock;
      if (block._type !== "block" || !Array.isArray(block.children)) return "";
      return block.children
        .map((child) => {
          if (!child || typeof child !== "object") return "";
          const span = child as PortableTextSpan;
          return span._type === "span" && typeof span.text === "string" ? span.text : "";
        })
        .join("");
    })
    .filter(Boolean)
    .join("\n\n");
}

export function plainTextToPortableText(value: string) {
  const paragraphs = value
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.map((paragraph, index) => ({
    _type: "block",
    _key: `paragraph-${index + 1}`,
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: `paragraph-${index + 1}-text`,
        marks: [],
        text: paragraph,
      },
    ],
  }));
}
