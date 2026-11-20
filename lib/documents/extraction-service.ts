/**
 * Document Extraction Service
 * Extensible provider architecture supporting:
 * 1. Google Cloud Document AI (PDF & document parsing with processor)
 * 2. Google Cloud Vision API (OCR for scanned images/PDFs)
 * 3. Native Serverless Extraction (pdfjs-dist, mammoth, UTF-8 text parser)
 */

export type ExtractorServiceId = "google-document-ai" | "google-cloud-vision" | "native-serverless";

export type ExtractionStatus = {
  serviceId: ExtractorServiceId;
  name: string;
  isAvailable: boolean;
  reason?: string;
  setupInstructions?: string;
};

export type DocumentExtractionResult = {
  source: string;
  paragraphPages: Array<number | null>;
  paragraphs: string[];
  extractorUsed: ExtractorServiceId;
  metadata?: Record<string, unknown>;
};

export function getExtractorAvailability(): ExtractionStatus[] {
  const hasGcpCreds = Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ||
    process.env.GOOGLE_CLOUD_PROJECT?.trim()
  );
  const hasDocAiProcessor = Boolean(process.env.DOCUMENT_AI_PROCESSOR_ID?.trim());
  const hasVisionKey = Boolean(process.env.VISION_API_KEY?.trim() || process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim());

  return [
    {
      serviceId: "google-document-ai",
      name: "Google Cloud Document AI",
      isAvailable: hasGcpCreds && hasDocAiProcessor,
      reason: hasDocAiProcessor
        ? undefined
        : "DOCUMENT_AI_PROCESSOR_ID or Google Cloud ADC credentials not configured.",
      setupInstructions: "Set GOOGLE_APPLICATION_CREDENTIALS and DOCUMENT_AI_PROCESSOR_ID to enable enterprise OCR & form parsing.",
    },
    {
      serviceId: "google-cloud-vision",
      name: "Google Cloud Vision API",
      isAvailable: hasVisionKey,
      reason: hasVisionKey
        ? undefined
        : "VISION_API_KEY or Google Cloud credentials not configured.",
      setupInstructions: "Set VISION_API_KEY or GOOGLE_APPLICATION_CREDENTIALS to enable scanned image OCR.",
    },
    {
      serviceId: "native-serverless",
      name: "Native High-Fidelity Parser (pdfjs-dist / mammoth / utf-8)",
      isAvailable: true,
      reason: "Always active as foundational server-side extractor.",
    },
  ];
}
