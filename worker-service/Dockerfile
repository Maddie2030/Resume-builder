# worker-service/Dockerfile

# Stage 1: The Build Stage
# -------------------------
FROM python:3.11-slim-bookworm AS builder

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies needed for Pillow and WeasyPrint
# Note: These will not be in the final image
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg-dev zlib1g-dev libpng-dev libfreetype6-dev \
    libxml2-dev libxslt1-dev libcairo2-dev libpango1.0-dev \
    libgdk-pixbuf-2.0-dev \
    gcc python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .


# Stage 2: The Production Stage
# -----------------------------
FROM python:3.11-slim-bookworm

# Set the working directory
WORKDIR /app

# Copy the Python packages from the builder stage
COPY --from=builder /usr/local /usr/local

# Copy the system libraries needed for WeasyPrint at runtime.
# This ensures a minimal but functional environment.
COPY --from=builder /usr/lib/x86_64-linux-gnu /usr/lib/x86_64-linux-gnu
COPY --from=builder /usr/share/fonts /usr/share/fonts
COPY --from=builder /etc/fonts /etc/fonts

# Copy the application code from the builder stage
COPY --from=builder /app /app

# Command to run the Celery worker
CMD ["celery", "-A", "app.celery_app", "worker", "--loglevel=info", "-Q", "render_queue"]