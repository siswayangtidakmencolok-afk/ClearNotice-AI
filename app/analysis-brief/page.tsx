import { AnalysisBriefPage } from "@/components/workspace/analysis-brief";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analysis Brief | ClearNotice AI",
  description: "Review a local prototype brief alongside its source-linked findings.",
};

export default function AnalysisBriefRoute() {
  return (
    <WorkspaceShell>
      <AnalysisBriefPage />
    </WorkspaceShell>
  );
}
