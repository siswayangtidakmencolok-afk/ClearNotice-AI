export type PdfTextItem = { str: string; hasEOL?: boolean; transform?: number[]; height?: number };

type Line = { text: string; y: number };

function joinLines(lines: string[]) {
  return lines.reduce((paragraph, line) => {
    if (!paragraph) return line;
    // A word hyphenated across a line break ("student-" + "led") is rejoined without a space.
    if (/[A-Za-z]-$/.test(paragraph) && /^[a-z]/.test(line)) return paragraph + line;
    return `${paragraph} ${line}`;
  }, "").replace(/\s+/g, " ").trim();
}

/**
 * Rebuilds paragraphs from one PDF page's text items. Lines come from pdf.js end-of-line markers
 * and baseline changes; a new paragraph starts where the vertical gap between lines is clearly
 * larger than the page's usual line spacing, or where text jumps upward (a new column or block).
 */
export function pdfPageParagraphs(items: PdfTextItem[]): string[] {
  const lines: Line[] = [];
  let current = "";
  let currentY: number | undefined;
  const flush = () => {
    const text = current.replace(/\s+/g, " ").trim();
    if (text && currentY !== undefined) lines.push({ text, y: currentY });
    current = "";
    currentY = undefined;
  };
  for (const item of items) {
    const y = item.transform?.[5] ?? currentY ?? 0;
    const height = item.height || 10;
    if (currentY !== undefined && current.trim() && Math.abs(y - currentY) > height * 0.5) flush();
    if (currentY === undefined && item.str.trim()) currentY = y;
    current += item.str;
    if (item.hasEOL) flush();
    else if (item.str && !item.str.endsWith(" ")) current += " ";
  }
  flush();
  if (lines.length <= 1) return lines.map((line) => line.text);

  const steps = lines.slice(1).map((line, index) => lines[index].y - line.y).filter((step) => step > 0).sort((a, b) => a - b);
  // Lower quartile, not median: on pages made of many short paragraphs, paragraph gaps can be
  // half of all line steps, which would make a median equal to the paragraph gap itself.
  const typicalStep = steps[Math.floor((steps.length - 1) / 4)] ?? 0;
  const paragraphs: string[][] = [[lines[0].text]];
  for (let index = 1; index < lines.length; index += 1) {
    const step = lines[index - 1].y - lines[index].y;
    const isBreak = typicalStep > 0 && (step > typicalStep * 1.5 || step < 0);
    if (isBreak) paragraphs.push([lines[index].text]);
    else paragraphs[paragraphs.length - 1].push(lines[index].text);
  }
  return paragraphs.map(joinLines).filter(Boolean);
}
