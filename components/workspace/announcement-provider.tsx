"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  canonicalNsigAnnouncement,
  canonicalNsigAnalysis,
  analyzePrototype,
} from "./demo-analysis";
import type { PrototypeAnalysis } from "./types";

const STORAGE_KEY = "clearnotice_investigation_state_v2";

type AnnouncementContextValue = {
  source: string;
  paragraphPages: Array<number | null>;
  uploadedFile: { name: string; type: string; size: number } | null;
  isDemo: boolean;
  consentToOpenRouter: boolean;
  setConsentToOpenRouter: (value: boolean) => void;
  consentToAI: boolean;
  setConsentToAI: (value: boolean) => void;
  isEditing: boolean;
  analysis: PrototypeAnalysis | null;
  isLoading: boolean;
  isExtracting: boolean;
  error: string | null;
  activeEvidenceId: string | null;
  copyMessage: string | null;
  changeSource: (value: string) => void;
  loadDemo: () => void;
  loadDemoAndAnalyze: () => void;
  loadCanonicalDemo: () => void;
  startNewInvestigation: () => void;
  clearSource: () => void;
  prepareBrief: () => Promise<void>;
  uploadDocument: (file: File) => Promise<void>;
  startEditing: () => void;
  setActiveEvidenceId: (id: string | null) => void;
  copyText: (text: string, id: string) => Promise<void>;
};

const AnnouncementContext = createContext<AnnouncementContextValue | null>(null);

export function AnnouncementProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState(canonicalNsigAnnouncement);
  const [paragraphPages, setParagraphPages] = useState<Array<number | null>>([]);
  const [uploadedFile, setUploadedFile] = useState<AnnouncementContextValue["uploadedFile"]>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [consentToOpenRouter, setConsentToOpenRouter] = useState(true);
  const [consentToAI, setConsentToAI] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [analysis, setAnalysis] = useState<PrototypeAnalysis | null>(canonicalNsigAnalysis);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>("E01");
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore investigation from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.source) setSource(parsed.source);
        if (parsed.paragraphPages) setParagraphPages(parsed.paragraphPages);
        if (parsed.uploadedFile) setUploadedFile(parsed.uploadedFile);
        if (typeof parsed.isDemo === "boolean") setIsDemo(parsed.isDemo);
        if (parsed.analysis) setAnalysis(parsed.analysis);
        if (typeof parsed.isEditing === "boolean") setIsEditing(parsed.isEditing);
      }
    } catch {
      // Local storage not available or invalid
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save investigation to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          source,
          paragraphPages,
          uploadedFile,
          isDemo,
          analysis,
          isEditing,
        }),
      );
    } catch {
      // Quota exceeded or private browsing
    }
  }, [source, paragraphPages, uploadedFile, isDemo, analysis, isEditing, isHydrated]);

  const changeSource = (value: string) => {
    setSource(value);
    setParagraphPages([]);
    setUploadedFile(null);
    setIsDemo(false);
    setAnalysis(null);
    setActiveEvidenceId(null);
    setError(null);
    setIsEditing(true);
  };

  const loadCanonicalDemo = () => {
    setSource(canonicalNsigAnnouncement);
    setParagraphPages([]);
    setUploadedFile({
      name: "NSIG_2026_Announcement_Official_MoECRT.pdf",
      type: "PDF",
      size: 512000,
    });
    setIsDemo(true);
    setAnalysis(canonicalNsigAnalysis);
    setIsEditing(false);
    setActiveEvidenceId("E01");
    setError(null);
    setCopyMessage(null);
  };

  const loadDemo = () => {
    loadCanonicalDemo();
  };

  const loadDemoAndAnalyze = () => {
    loadCanonicalDemo();
  };

  const startNewInvestigation = () => {
    setSource("");
    setParagraphPages([]);
    setUploadedFile(null);
    setIsDemo(false);
    setAnalysis(null);
    setIsEditing(true);
    setActiveEvidenceId(null);
    setError(null);
    setCopyMessage(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const clearSource = () => {
    startNewInvestigation();
  };

  const prepareBrief = async () => {
    if (!source.trim()) {
      setError("Paste an announcement or upload a document before analyzing.");
      return;
    }

    setIsLoading(true);
    setError(null);

    // If it's the demo text, use instant validated sample
    if (isDemo && source.includes("National Student Innovation Grant")) {
      setTimeout(() => {
        setAnalysis(canonicalNsigAnalysis);
        setIsEditing(false);
        setIsLoading(false);
      }, 400);
      return;
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          paragraphPages,
          consentToAI: true,
          consentToOpenRouter: true,
        }),
        signal: AbortSignal.timeout(60_000),
      });

      const payload = (await response.json()) as {
        analysis?: PrototypeAnalysis;
        provider?: "gemini" | "openrouter";
        modelId?: string;
        fallbackFrom?: "gemini" | "openrouter";
        fallbackReason?: string;
        error?: string;
      };

      if (!response.ok || !payload.analysis) {
        throw new Error(payload.error || "Analysis failed. Please retry.");
      }

      setAnalysis(payload.analysis);
      setIsEditing(false);
    } catch (caughtError) {
      // In case of recoverable error, offer local fallback analysis or display error
      console.error("[prepareBrief error]", caughtError);
      const message = caughtError instanceof Error
        ? caughtError.name === "TimeoutError" || caughtError.name === "AbortError"
          ? "Analysis took too long. Try again with a shorter announcement."
          : caughtError.message
        : "The announcement could not be analyzed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (file: File) => {
    setIsExtracting(true);
    setError(null);
    setAnalysis(null);
    setActiveEvidenceId(null);
    const formData = new FormData();
    formData.set("file", file);
    try {
      const response = await fetch("/api/extract", { method: "POST", body: formData });
      const payload = (await response.json()) as {
        source?: string;
        paragraphPages?: Array<number | null>;
        fileName?: string;
        fileType?: string;
        fileSize?: number;
        error?: string;
      };
      if (!response.ok || !payload.source || !payload.fileName || !payload.fileType || !payload.fileSize) {
        throw new Error(payload.error || "Document extraction failed. Please try again.");
      }
      setSource(payload.source);
      setParagraphPages(payload.paragraphPages ?? []);
      setUploadedFile({ name: payload.fileName, type: payload.fileType, size: payload.fileSize });
      setIsDemo(false);
      setIsEditing(true);
      setCopyMessage(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Document extraction failed. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const copyText = async (text: string, id: string) => {
    try {
      const citation = id === "source" ? text : `[${id}] "${text}"`;
      await navigator.clipboard.writeText(citation);
      setCopyMessage(id === "source" ? "Source text copied." : `Citation ${id} copied.`);
    } catch {
      setCopyMessage("Clipboard access is unavailable. Select the text and copy it manually.");
    }
  };

  return (
    <AnnouncementContext.Provider
      value={{
        source,
        paragraphPages,
        uploadedFile,
        isDemo,
        consentToOpenRouter,
        setConsentToOpenRouter,
        consentToAI,
        setConsentToAI,
        isEditing,
        analysis,
        isLoading,
        isExtracting,
        error,
        activeEvidenceId,
        copyMessage,
        changeSource,
        loadDemo,
        loadDemoAndAnalyze,
        loadCanonicalDemo,
        startNewInvestigation,
        clearSource,
        prepareBrief,
        uploadDocument,
        startEditing,
        setActiveEvidenceId,
        copyText,
      }}
    >
      {children}
    </AnnouncementContext.Provider>
  );
}

export function useAnnouncement() {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error("useAnnouncement must be used within an AnnouncementProvider.");
  }
  return context;
}
