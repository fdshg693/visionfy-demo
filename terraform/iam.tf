# =============================================================================
# Service Account for Frontend (to access Secret Manager)
# =============================================================================

resource "google_service_account" "frontend" {
  project      = google_project.main.project_id
  account_id   = "frontend-cloudrun"
  display_name = "Frontend Cloud Run Service Account"

  depends_on = [google_project_service.apis["iam.googleapis.com"]]
}

resource "google_secret_manager_secret_iam_member" "frontend_gemini_key" {
  project   = google_project.main.project_id
  secret_id = google_secret_manager_secret.gemini_api_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.frontend.email}"
}

# =============================================================================
# Public access for both Cloud Run services
# =============================================================================

resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  project  = google_project.main.project_id
  name     = google_cloud_run_v2_service.backend.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  project  = google_project.main.project_id
  name     = google_cloud_run_v2_service.frontend.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
