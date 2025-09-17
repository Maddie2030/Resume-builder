# Dockerfile for Template Service (FastAPI)
# Stage 1: The Build Stage
# -------------------------
FROM python:3.10-slim-bullseye AS builder

WORKDIR /app

# Copy the requirements file first for layer caching.
COPY requirements.txt .

# Install Python dependencies, including gunicorn and uvicorn.
RUN pip install --no-cache-dir gunicorn uvicorn -r requirements.txt

# Copy the rest of the application source code.
COPY . .


# Stage 2: The Production Stage
# -----------------------------
FROM python:3.10-slim-bullseye

WORKDIR /app

# Copy only the installed Python packages from the builder stage.
COPY --from=builder /usr/local /usr/local
# Copy the application code from the builder stage.
COPY --from=builder /app /app

# Expose the port on which the API will run.
EXPOSE 8002

# Set dynamic environment variables for Gunicorn workers.
ENV WORKERS=2
ENV TIMEOUT=120

# Start the application with Gunicorn using Uvicorn workers.
CMD ["gunicorn", "app.main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8002", \
     "--workers", "$WORKERS", \
     "--timeout", "$TIMEOUT"]