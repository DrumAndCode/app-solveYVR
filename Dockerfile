FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent + server code
COPY agent/ agent/
COPY server/ server/

# Railway sets PORT env var
ENV PORT=8000
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000"]
