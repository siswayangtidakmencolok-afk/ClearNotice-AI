export type SourceSentence = {
  paragraph: number;
  quote: string;
};

const SENTENCE_END = /[.!?]/;
const CLOSING = /["'”’)\]]/;

/**
 * Splits a paragraph into sentences. Punctuation only ends a sentence when it is followed by
 * whitespace or the end of the paragraph, so decimals (3.0), emails, URLs and domain names
 * (name@site.example.org, portal.example.org/apply) stay inside their sentence.
 */
export function splitSentences(paragraph: string): string[] {
  const sentences: string[] = [];
  let start = 0;

  for (let index = 0; index < paragraph.length; index += 1) {
    if (!SENTENCE_END.test(paragraph[index])) continue;

    let end = index + 1;
    while (SENTENCE_END.test(paragraph[end] ?? "")) end += 1;
    while (CLOSING.test(paragraph[end] ?? "")) end += 1;
    const next = paragraph[end];
    if (next !== undefined && !/\s/.test(next)) {
      index = end - 1;
      continue;
    }
    const sentence = paragraph.slice(start, end).trim();
    if (sentence) sentences.push(sentence);
    start = end;
    index = end - 1;
  }

  const remainder = paragraph.slice(start).trim();
  if (remainder) sentences.push(remainder);
  return sentences;
}

export function getSourceSentences(text: string): SourceSentence[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .flatMap((paragraphText, index) =>
      splitSentences(paragraphText).map((quote) => ({ paragraph: index + 1, quote })),
    );
}
