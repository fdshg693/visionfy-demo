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
