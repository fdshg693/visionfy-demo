terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  region = var.region
}

# =============================================================================
# Project
# =============================================================================

resource "google_project" "main" {
  name            = var.project_name
  project_id      = var.project_id
  org_id          = var.org_id
  billing_account = var.billing_account
  deletion_policy = "DELETE"
}

# =============================================================================
# Enable required APIs
# =============================================================================

resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com",
  ])

  project                    = google_project.main.project_id
  service                    = each.value
  disable_dependent_services = false
  disable_on_destroy         = false
}
