@echo off
cd /d "C:\Users\asus\Desktop\AI Resume Analyser"

REM Create venv if it doesn't exist
IF NOT EXIST "venv" (
    python -m venv venv
)

REM Activate venv
call "venv\Scripts\activate.bat"

REM Install dependencies
pip install -r requirements.txt

REM Create .env from example if not exists
IF NOT EXIST ".env" (
    copy ".env.example" ".env"
    echo.
    echo ---------------------------------------------------
    echo Open the .env file and fill your OPENAI_API_KEY etc.
    echo File path: C:\Users\asus\Desktop\AI Resume Analyser\.env
    echo ---------------------------------------------------
    echo.
    pause
)

REM Run FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000