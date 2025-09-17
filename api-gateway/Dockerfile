# Dockerfile for API Gateway (FastAPI)
# Stage 1: Build dependencies
# ----------------------------
FROM python:3.10-slim-bullseye AS builder

WORKDIR /app

# Copy and install Python dependencies.
# The 'gcc' build dependency is installed and then immediately uninstalled
# in the same RUN command to keep the final image clean.
COPY requirements.txt .
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc \
    && pip install --no-cache-dir -r requirements.txt \
    && apt-get purge -y --auto-remove gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy the rest of the application source code.
COPY . .


# Stage 2: Production image
# --------------------------
FROM python:3.10-slim-bullseye

WORKDIR /app

# Copy only the installed dependencies from the builder stage.
COPY --from=builder /usr/local /usr/local

# Copy the application code from the builder stage.
COPY --from=builder /app /app

# Expose the port on which the API will run.
EXPOSE 8000

# Configure Gunicorn environment variables for dynamic scaling.
# These can be overridden at runtime.
ENV WORKERS=2
ENV TIMEOUT=120

# Start the application with Gunicorn using Uvicorn workers.
# The number of workers and timeout are set dynamically from ENV variables.
CMD ["gunicorn", "app.main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "$WORKERS", \
     "--timeout", "$TIMEOUT", \
     "--log-level", "info", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]