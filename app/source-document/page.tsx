import type { Metadata } from "next";
import { SourceDocumentPage } from "@/components/workspace/source-document-page";

export const metadata: Metadata = {
  title: "Source Document | ClearNotice AI",
  description: "Read announcement text and navigate its cited passages.",
};

export default function SourceDocumentRoute() {
  return <SourceDocumentPage />;
}
