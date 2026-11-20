import type { Metadata } from "next";
import { DocumentLibrary } from "@/components/workspace/document-library";

export const metadata: Metadata = { title: "Document library | ClearNotice AI", description: "Retrieve and compare evidence across saved announcements." };
export default function DocumentsPage() { return <DocumentLibrary />; }
