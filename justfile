# =============================================================================
# Visionfy Demo — task runner
# =============================================================================
# Install just:  https://github.com/casey/just
#   winget install --id Casey.Just  (Windows)
#   brew install just               (macOS)
#
# Usage:
#   just                 # list recipes
#   just tf-plan dev
#   just tf-apply prod
#   just docker-release-all visionfy-demo-prod
# =============================================================================

set windows-shell := ["powershell.exe", "-NoLogo", "-NoProfile", "-Command"]

# Default region for Artifact Registry / Cloud Run.
region := "asia-northeast1"

# Show all recipes.
default:
    @just --list

# =============================================================================
# Terraform — env is "dev" or "prod"
# =============================================================================
# Per-env layout:
#   terraform/environments/{env}.tfvars   (gitignored, contains secrets)
#   terraform/states/{env}.tfstate        (gitignored)

# Initialize terraform (run once, or after provider changes).
tf-init:
    cd terraform && terraform init

# Validate configuration.
tf-validate:
    cd terraform && terraform validate

# Format all .tf files in place.
tf-fmt:
    cd terraform && terraform fmt -recursive

# Plan changes for an environment.
tf-plan env:
    cd terraform && terraform plan -var-file=environments/{{env}}.tfvars -state=states/{{env}}.tfstate

# Apply changes for an environment.
tf-apply env:
    cd terraform && terraform apply -var-file=environments/{{env}}.tfvars -state=states/{{env}}.tfstate

# Destroy all resources in an environment.
tf-destroy env:
    cd terraform && terraform destroy -var-file=environments/{{env}}.tfvars -state=states/{{env}}.tfstate

# Show outputs for an environment.
tf-output env:
    cd terraform && terraform output -state=states/{{env}}.tfstate

# List state entries for an environment.
tf-state-list env:
    cd terraform && terraform state list -state=states/{{env}}.tfstate

# Bootstrap base resources (project, APIs, registry, secrets, SA).
# Run this BEFORE pushing Docker images for the first time.
tf-bootstrap env:
    cd terraform && terraform apply -var-file=environments/{{env}}.tfvars -state=states/{{env}}.tfstate -target=google_project.main -target=google_project_service.apis -target=google_artifact_registry_repository.docker -target=google_secret_manager_secret.gemini_api_key -target=google_secret_manager_secret_version.gemini_api_key -target=google_service_account.frontend -target=google_secret_manager_secret_iam_member.frontend_gemini_key

# =============================================================================
# Docker — build & push to Artifact Registry
# =============================================================================
# project_id: e.g. "visionfy-demo-dev" / "visionfy-demo-prod"
# tag:        image tag (defaults to "latest")

# Configure docker auth for Artifact Registry.
docker-auth:
    gcloud auth configure-docker {{region}}-docker.pkg.dev

# Build backend image.
docker-build-backend project_id tag="latest":
    docker build -t {{region}}-docker.pkg.dev/{{project_id}}/visionfy-demo/backend:{{tag}} backend

# Build frontend image.
docker-build-frontend project_id tag="latest":
    docker build -t {{region}}-docker.pkg.dev/{{project_id}}/visionfy-demo/frontend:{{tag}} frontend

# Push backend image.
docker-push-backend project_id tag="latest":
    docker push {{region}}-docker.pkg.dev/{{project_id}}/visionfy-demo/backend:{{tag}}

# Push frontend image.
docker-push-frontend project_id tag="latest":
    docker push {{region}}-docker.pkg.dev/{{project_id}}/visionfy-demo/frontend:{{tag}}

# Build + push backend.
docker-release-backend project_id tag="latest": (docker-build-backend project_id tag) (docker-push-backend project_id tag)

# Build + push frontend.
docker-release-frontend project_id tag="latest": (docker-build-frontend project_id tag) (docker-push-frontend project_id tag)

# Build + push both services.
docker-release-all project_id tag="latest": (docker-release-backend project_id tag) (docker-release-frontend project_id tag)
