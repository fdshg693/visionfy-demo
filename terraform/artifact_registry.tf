resource "google_artifact_registry_repository" "docker" {
  project       = google_project.main.project_id
  location      = var.region
  repository_id = "visionfy-demo"
  description   = "Docker images for Visionfy Demo (backend + frontend)"
  format        = "DOCKER"

  cleanup_policy_dry_run = false

  depends_on = [google_project_service.apis["artifactregistry.googleapis.com"]]
}
