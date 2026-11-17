"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { analyzePrototype, demoAnnouncement } from "./demo-analysis";
import type { PrototypeAnalysis } from "./types";

type AnnouncementContextValue = {
  source: string;
  isDemo: boolean;
  isEditing: boolean;
  analysis: PrototypeAnalysis | null;
  isLoading: boolean;
  error: string | null;
  activeEvidenceId: string | null;
  copyMessage: string | null;
  changeSource: (value: string) => void;
  loadDemo: () => void;
  loadDemoAndAnalyze: () => void;
  clearSource: () => void;
  prepareBrief: () => void;
  startEditing: () => void;
  setActiveEvidenceId: (id: string | null) => void;
  copyText: (text: string, id: string) => Promise<void>;
};

const AnnouncementContext = createContext<AnnouncementContextValue | null>(null);

export function AnnouncementProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [analysis, setAnalysis] = useState<PrototypeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const changeSource = (value: string) => {
    setSource(value);
    setIsDemo(false);
    setAnalysis(null);
    setActiveEvidenceId(null);
    setError(null);
  };

  const loadDemo = () => {
    setSource(demoAnnouncement);
    setIsDemo(true);
    setAnalysis(null);
    setIsEditing(true);
    setActiveEvidenceId(null);
    setError(null);
    setCopyMessage(null);
  };

  const loadDemoAndAnalyze = () => {
    setSource(demoAnnouncement);
    setIsDemo(true);
    setIsEditing(false);
    setActiveEvidenceId(null);
    setError(null);
    setCopyMessage(null);

    try {
      setAnalysis(analyzePrototype(demoAnnouncement));
    } catch (caughtError) {
      setAnalysis(null);
      setError(
        caughtError instanceof Error
          ? `The sample could not be prepared: ${caughtError.message}`
          : "The sample could not be prepared. Please try again.",
      );
    }
  };

  const clearSource = () => {
    setSource("");
    setIsDemo(false);
    setAnalysis(null);
    setIsEditing(true);
    setActiveEvidenceId(null);
    setError(null);
    setCopyMessage(null);
  };

  const prepareBrief = () => {
    if (!source.trim()) {
      setError("Paste an announcement before preparing a prototype brief.");
      return;
    }

    setIsLoading(true);
    setError(null);
    window.setTimeout(() => {
      try {
        setAnalysis(analyzePrototype(source));
        setIsEditing(false);
      } catch (caughtError) {
        setAnalysis(null);
        setError(
          caughtError instanceof Error
            ? `The source text could not be prepared: ${caughtError.message}`
            : "The source text could not be prepared. Check the text and try again.",
        );
      } finally {
        setIsLoading(false);
      }
    }, 0);
  };

  const startEditing = () => {
    setIsEditing(true);
    setAnalysis(null);
    setActiveEvidenceId(null);
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
        isDemo,
        isEditing,
        analysis,
        isLoading,
        error,
        activeEvidenceId,
        copyMessage,
        changeSource,
        loadDemo,
        loadDemoAndAnalyze,
        clearSource,
        prepareBrief,
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
