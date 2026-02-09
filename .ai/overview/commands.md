# Development Commands

## Frontend (from `frontend/`)
```powershell
pnpm install       # Install dependencies
pnpm dev           # Development server (localhost:3000)
pnpm build         # Production build
pnpm lint          # Run ESLint
```

## Backend (from `backend/`)
```powershell
pip install -r requirements.txt   # Install dependencies
python src/main.py                 # Run dev server (localhost:8080)
```

## Docker (from `backend/`)
```powershell
docker build -t visionfy-demo-backend .
docker run --name my-visionfy-app -p 8080:8080 -e PORT=8080 visionfy-demo-backend
```
