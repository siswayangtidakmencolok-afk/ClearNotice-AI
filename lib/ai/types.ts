import type { GeminiAnalysis } from "@/lib/analysis-schema";

export type AIProviderId = "gemini" | "openrouter";
export type AIErrorCategory =
  | "configuration"
  | "consent_required"
  | "invalid_request_or_config"
  | "authentication_or_permission"
  | "payment_required"
  | "invalid_response"
  | "model_or_endpoint_not_found"
  | "usage_limit"
  | "provider_service_failure"
  | "network"
  | "network_dns"
  | "network_refused"
  | "network_tls"
  | "network_blocked"
  | "timeout"
  | "invalid_json"
  | "json_validation";

export type AIErrorStage =
  | "configuration"
  | "dns"
  | "connect"
  | "tls"
  | "http"
  | "request"
  | "response"
  | "validation"
  | "timeout"
  | "blocked";

export class AIProviderError extends Error {
  readonly provider: AIProviderId;
  readonly category: AIErrorCategory;
  readonly status: number;
  readonly providerStatus?: number;
  readonly providerCode?: string;
  readonly errorStage?: AIErrorStage;

  constructor(
    message: string,
    provider: AIProviderId,
    category: AIErrorCategory,
    status: number,
    providerStatus?: number,
    providerCode?: string,
    errorStage?: AIErrorStage,
  ) {
    super(message);
    this.name = "AIProviderError";
    this.provider = provider;
    this.category = category;
    this.status = status;
    this.providerStatus = providerStatus;
    this.providerCode = providerCode;
    this.errorStage = errorStage;
  }
}

export type AIAnalysisResult = {
  analysis: GeminiAnalysis;
  provider: AIProviderId;
  modelId: string;
  fallbackFrom?: AIProviderId;
  fallbackReason?: string;
  durationMs?: number;
};
