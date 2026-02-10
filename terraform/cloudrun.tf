# =============================================================================
# Cloud Run - Backend (Flask API)
# =============================================================================

resource "google_cloud_run_v2_service" "backend" {
  project  = google_project.main.project_id
  name     = "visionfy-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.backend.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/visionfy-demo/backend:${var.backend_image_tag}"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "2"
          memory = "4Gi"
        }
      }

      env {
        name  = "MODEL_GCS_BUCKET"
        value = google_storage_bucket.models.name
      }

      env {
        name  = "MODEL_GCS_PATH"
        value = "models/model.ckpt"
      }

      env {
        name  = "LOG_LEVEL"
        value = "INFO"
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 10
        period_seconds        = 15
        failure_threshold     = 6
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }
  }

  depends_on = [
    google_project_service.apis["run.googleapis.com"],
    google_artifact_registry_repository.docker,
  ]
}

# =============================================================================
# Cloud Run - Frontend (Next.js)
# =============================================================================

resource "google_cloud_run_v2_service" "frontend" {
  project  = google_project.main.project_id
  name     = "visionfy-frontend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.frontend.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/visionfy-demo/frontend:${var.frontend_image_tag}"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "API_BASE_URL"
        value = google_cloud_run_v2_service.backend.uri
      }

      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.gemini_api_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "LOG_LEVEL"
        value = "info"
      }

      startup_probe {
        tcp_socket {
          port = 3000
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }
  }

  depends_on = [
    google_project_service.apis["run.googleapis.com"],
    google_artifact_registry_repository.docker,
    google_secret_manager_secret_version.gemini_api_key,
  ]
}
