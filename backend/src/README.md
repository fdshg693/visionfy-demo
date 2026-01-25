# Backend Source Code (`src`)

This directory contains the actual executable code for the backend API.

## 🧱 Code Structure

```text
src/
├── main.py           # 🏁 Entry Point
│                     Initializes Flask app and defines routes.
│
├── api/              # 🧠 API Logic
│                     Contains specific logic modules (e.g., createclane).
│
├── imgs/             # 🖼️ Static Assets
│                     Static images like favicon.
│
├── Dockerfile        # 🐳 Container Config
│                     Defines how to build the image for Cloud Run.
│
└── requirements.txt  # 📦 Dependencies
                      List of Python packages allowed in the environment.
```

## 🔧 Responsibilities

- **API Server**: Host the API endpoints on port `8080`.
- **Health Checks**: Provide `/health` endpoint for monitoring.
- **Routing**: Delegate requests to appropriate modules in `api/`.

## 🏃 Running Locally

1. **Install Dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

2. **Run Server**:
   ```bash
   python main.py
   ```
   The server will start at `http://0.0.0.0:8080`.

## 📡 Key Endpoints

| Method | Path               | Description                        |
| ------ | ------------------ | ---------------------------------- |
| `GET`  | `/`                | Redirects to `/health`             |
| `GET`  | `/health`          | Returns `{"status": "healthy"}`    |
| `ANY`  | `/api/createclane` | Logic wrapper for image processing |
