# AI Resume Analyzer API

A production-ready REST API built with **FastAPI** that accepts PDF resumes, extracts text using **PyMuPDF**, and leverages **OpenAI** to generate a structured analysis — including key skills, strengths, weaknesses, improvement suggestions, and a resume score out of 100.

## Features

- **JWT Authentication** — Secure registration, login, and token-protected routes.
- **PDF Parsing** — Extracts clean text from uploaded PDF resumes.
- **AI-Powered Analysis** — Uses OpenAI GPT-3.5-turbo to analyze resumes like an HR recruiter.
- **Resume History** — Retrieve past analyses from the database.
- **Swagger UI** — Interactive API documentation at `/docs`.

## Tech Stack

| Layer          | Technology               |
|----------------|--------------------------|
| Framework      | FastAPI                  |
| ORM            | SQLAlchemy               |
| Database       | SQLite (dev) / PostgreSQL (prod) |
| Auth           | JWT (python-jose) + bcrypt |
| PDF Parsing    | PyMuPDF (fitz)           |
| AI             | OpenAI API               |
| Server         | Uvicorn                  |

## Project Structure

```
ai-resume-analyzer/
├── app/
│   ├── main.py              # Application entrypoint
│   ├── database.py           # SQLAlchemy engine & session
│   ├── models.py             # ORM models (User, Resume)
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── auth.py               # Password hashing & JWT utilities
│   ├── resume_parser.py      # PDF text extraction
│   ├── ai_service.py         # OpenAI integration
│   └── routes/
│       ├── auth_routes.py    # /register, /login
│       └── resume_routes.py  # /resume/upload, /resume/history, /resume/{id}
├── requirements.txt
├── .env.example
└── README.md
```

## API Endpoints

| Method | Endpoint             | Auth     | Description                    |
|--------|----------------------|----------|--------------------------------|
| GET    | `/`                  | No       | Health check                   |
| POST   | `/register`          | No       | Register a new user            |
| POST   | `/login`             | No       | Login and receive JWT token    |
| POST   | `/resume/upload`     | Required | Upload PDF for AI analysis     |
| GET    | `/resume/history`    | Required | List all user resumes          |
| GET    | `/resume/{resume_id}`| Required | Get full resume analysis       |

## Setup Instructions (Local Development)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ai-resume-analyzer
```

### 2. Create a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate   # macOS/Linux
# venv\Scripts\activate    # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```env
DATABASE_URL=sqlite:///./resume_analyzer.db
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
OPENAI_API_KEY=sk-your-openai-api-key
```

### 5. Run the server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Open Swagger UI

Navigate to [http://localhost:8000/docs](http://localhost:8000/docs) to explore and test the API interactively.

## Deployment on Render

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Create a Render Web Service

1. Go to [https://render.com](https://render.com) and sign in.
2. Click **New → Web Service**.
3. Connect your GitHub repository.
4. Configure:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 3. Set Environment Variables

In the Render dashboard, add:

| Key                          | Value                        |
|------------------------------|------------------------------|
| `DATABASE_URL`               | Your PostgreSQL connection URL |
| `SECRET_KEY`                 | A strong random secret key   |
| `ALGORITHM`                  | `HS256`                      |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| `30`                         |
| `OPENAI_API_KEY`             | Your OpenAI API key          |

### 4. Add PostgreSQL (optional)

1. In Render, click **New → PostgreSQL**.
2. Copy the **Internal Database URL**.
3. Set it as `DATABASE_URL` in your web service environment variables.

### 5. Deploy

Render will auto-deploy on every push to `main`. Your API will be live at:

```
https://your-service-name.onrender.com/docs
```

## License

MIT
