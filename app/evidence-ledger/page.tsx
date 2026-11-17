import { EvidenceLedgerPage } from "@/components/workspace/evidence-ledger";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evidence Ledger | ClearNotice AI",
  description: "Review source passages linked to announcement findings.",
};

export default function EvidenceLedgerRoute() {
  return (
    <WorkspaceShell>
      <EvidenceLedgerPage />
    </WorkspaceShell>
  );
}
