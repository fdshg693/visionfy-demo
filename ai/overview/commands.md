# Development Commands

## Frontend (from `frontend/`)
```powershell
pnpm install       # Install dependencies
pnpm dev           # Development server (localhost:3000)
pnpm build         # Production build
pnpm start         # Start production server
pnpm lint          # Run ESLint
```

## Backend (from `backend/`)
```powershell
pip install -r requirements.txt   # Install dependencies
python src/main.py                 # Run dev server (localhost:8080)
```

## Docker

### Backend (from `backend/`)
```powershell
docker build -t visionfy-demo-backend .
docker run --name my-visionfy-app -p 8080:8080 -e PORT=8080 visionfy-demo-backend
```

### Frontend (from `frontend/`)
```powershell
docker build -t visionfy-demo-frontend .
docker run --name my-visionfy-frontend -p 3000:3000 visionfy-demo-frontend
```

### Push to Artifact Registry
```powershell
docker build -t {REGION}-docker.pkg.dev/{PROJECT_ID}/visionfy-demo/backend:latest ./backend
docker push {REGION}-docker.pkg.dev/{PROJECT_ID}/visionfy-demo/backend:latest

docker build -t {REGION}-docker.pkg.dev/{PROJECT_ID}/visionfy-demo/frontend:latest ./frontend
docker push {REGION}-docker.pkg.dev/{PROJECT_ID}/visionfy-demo/frontend:latest
```

## Terraform (from `terraform/`)
```powershell
terraform init       # Initialize providers
terraform validate   # Validate configuration
terraform plan       # Preview changes
terraform apply      # Apply changes
terraform output     # Show deployment URLs
```

Details: `terraform/DEPLOY.md`, `terraform/README.md`
