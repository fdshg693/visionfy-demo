# =============================================================================
# GCS Bucket - Model Storage
# =============================================================================

resource "google_storage_bucket" "models" {
  project                     = google_project.main.project_id
  name                        = "${var.project_id}-models"
  location                    = var.region
  force_destroy               = true
  uniform_bucket_level_access = true

  depends_on = [google_project_service.apis["storage.googleapis.com"]]
}
