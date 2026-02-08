# Project Overview

Visionfy Demo is a visual image processing workflow application. Users build node-based workflows (Start → Process nodes → End) to apply OpenCV transformations to images, with results displayed in real-time.

## Tech Stack

- **Frontend**: Next.js 16 with React 19, TypeScript, Tailwind CSS, and React Flow (@xyflow/react)
- **Backend**: Python Flask API with OpenCV for image processing

## Environment Variables

- `API_BASE_URL` - Backend URL (defaults to `http://localhost:8080`)
