import mammoth from "mammoth";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { withApiRequest } from "@/lib/sentry-api";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const MIN_PDF_TEXT_CHARS = 40;
const requireFromApp = createRequire(`${process.cwd()}/package.json`);
GlobalWorkerOptions.workerSrc = pathToFileURL(
  requireFromApp.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs"),
).href;
const MIME_BY_EXTENSION: Record<string, string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  txt: ["text/plain"],
};

function normalizePageText(value: string) {
  return value.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean).join(" ").trim();
}

async function extractRequest(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload could not be read. Choose a PDF, DOCX, or TXT file." }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a document to upload." }, { status: 400 });
  }
  if (file.size === 0) return NextResponse.json({ error: "The selected document is empty." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Documents must be 4 MB or smaller for reliable serverless upload." }, { status: 413 });

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const expectedMimes = MIME_BY_EXTENSION[extension];
  if (!expectedMimes || !expectedMimes.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported document type. Choose a PDF, DOCX, or TXT file with a matching file type." }, { status: 415 });
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let paragraphs: string[] = [];
    let paragraphPages: Array<number | null> = [];

    if (extension === "pdf") {
      const pdf = await getDocument({ data: bytes, useSystemFonts: true }).promise;
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const pageText = normalizePageText(content.items
          .filter((item) => "str" in item)
          .map((item) => ("str" in item ? item.str : ""))
          .join(" "));
        if (pageText) {
          paragraphs.push(pageText);
          paragraphPages.push(pageNumber);
        }
      }
    } else if (extension === "docx") {
      const extracted = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      paragraphs = extracted.value.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
      paragraphPages = paragraphs.map(() => null);
    } else {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/\r\n?/g, "\n");
      paragraphs = text.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
      paragraphPages = paragraphs.map(() => null);
    }

    const source = paragraphs.join("\n\n").trim();
    if (!source) {
      return NextResponse.json({ error: extension === "pdf"
        ? "This PDF has no selectable text. It may be scanned or image-only; OCR is not supported yet."
        : "No readable text was found in this document." }, { status: 422 });
    }
    if (extension === "pdf" && source.length < MIN_PDF_TEXT_CHARS) {
      return NextResponse.json({ error: "This PDF has too little selectable text. It may be scanned or image-only; OCR is not supported yet." }, { status: 422 });
    }
    if (source.length > 120_000) {
      return NextResponse.json({ error: "Extracted text is over the 120,000 character analysis limit. Upload a shorter document." }, { status: 413 });
    }
    return NextResponse.json({
      source,
      paragraphPages,
      fileName: file.name,
      fileType: extension.toUpperCase(),
      fileSize: file.size,
      paragraphCount: paragraphs.length,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      return NextResponse.json({ error: "The text file is not valid UTF-8. Save it as UTF-8 and upload again." }, { status: 422 });
    }
    Sentry.getIsolationScope().setTag("failure_kind", "document_extraction_failure");
    Sentry.captureException(new Error("Unexpected document extraction failure"));
    return NextResponse.json({ error: "The document could not be extracted. Check that it is not damaged or password-protected." }, { status: 422 });
  }
}

export function POST(request: Request) {
  return withApiRequest(request, "/api/extract", () => extractRequest(request));
}
