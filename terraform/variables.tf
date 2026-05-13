variable "project_id" {
  description = "GCP project ID to create"
  type        = string
}

variable "project_name" {
  description = "Human-readable project name"
  type        = string
  default     = "Visionfy Demo"
}

variable "billing_account" {
  description = "GCP billing account ID"
  type        = string
}

variable "region" {
  description = "GCP region for all resources"
  type        = string
  default     = "asia-northeast1"
}

variable "backend_image_tag" {
  description = "Tag for the backend container image"
  type        = string
  default     = "latest"
}

variable "frontend_image_tag" {
  description = "Tag for the frontend container image"
  type        = string
  default     = "latest"
}

variable "gemini_api_key" {
  description = "Gemini API key for the chat feature"
  type        = string
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Runtime env vars (injected into Cloud Run containers)
# -----------------------------------------------------------------------------
# 値の対応関係は `docs/features/ENVIRONMENT.md` の一覧表を参照。

variable "backend_log_level" {
  description = "LOG_LEVEL for the backend Flask app (DEBUG|INFO|WARNING|ERROR)"
  type        = string
  default     = "INFO"
}

variable "frontend_log_level" {
  description = "LOG_LEVEL for the frontend Next.js app (debug|info|warn|error)"
  type        = string
  default     = "info"
}

variable "frontend_enable_cloud_logging" {
  description = "ENABLE_CLOUD_LOGGING for the frontend (routes pino to @google-cloud/logging-pino)"
  type        = bool
  default     = true
}

variable "model_gcs_object_path" {
  description = "Object path of the Patchcore checkpoint inside the models bucket"
  type        = string
  default     = "models/model.ckpt"
}
