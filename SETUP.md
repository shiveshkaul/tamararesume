# TamaraApply Pro — Setup Guide

## Prerequisites
- **Node.js 18+** installed
- **VS Code** (recommended)

## Installation

```bash
# 1. Install all dependencies
cd tamaraapply-pro
npm install concurrently
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. (Optional) Install Playwright for job scraping
cd backend && npx playwright install chromium && cd ..
```

## Running

```bash
# Start both frontend and backend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## Project Structure

| Directory | Description |
|-----------|-------------|
| `frontend/` | React + Vite + TailwindCSS app |
| `backend/` | Node.js + Express + SQLite API |
| `data/` | Auto-created persistent storage |

## Features

- ✅ Pixel-perfect editable resume canvas (Tamara Steer's CV)
- ✅ AI resume tailoring via Groq LLM
- ✅ ATS score with keyword analysis
- ✅ German cover letter generation
- ✅ Multi-platform job scraping (Indeed, StepStone, LinkedIn, etc.)
- ✅ Real-time job notifications (SSE + browser notifications)
- ✅ Application tracker with status management
- ✅ PDF export (html2pdf.js)
- ✅ Manual & Auto modes
- ✅ SQLite database with structured file storage

## API Key

The Groq API key is pre-configured in `backend/.env`. No setup needed.
