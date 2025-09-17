# Stage 1: The Build Stage
# -------------------------
FROM python:3.11-slim-bookworm AS builder

# Set the working directory
WORKDIR /app

# Install system dependencies for WeasyPrint and other fonts.
# The build dependencies (e.g., build-essential) are installed in this stage only.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libgdk-pixbuf-2.0-dev \
    libxml2-dev \
    libxslt1-dev \
    fonts-dejavu-core \
    fonts-liberation \
    fonts-noto \
    # Clean up APT cache to reduce image size
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first for layer caching
COPY requirements.txt .

# Install Python dependencies, including Gunicorn and Uvicorn
RUN pip install --no-cache-dir gunicorn uvicorn --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .


# Stage 2: The Production Stage
# -----------------------------
FROM python:3.11-slim-bookworm

# Set the working directory
WORKDIR /app

# Copy only the necessary system libraries from the builder stage
COPY --from=builder /usr/lib/x86_64-linux-gnu /usr/lib/x86_64-linux-gnu
# COPY --from=builder /usr/lib/arm-linux-gnueabihf /usr/lib/arm-linux-gnueabihf
COPY --from=builder /etc/fonts /etc/fonts
COPY --from=builder /usr/share/fonts /usr/share/fonts

# Copy the Python packages from the builder stage
COPY --from=builder /usr/local /usr/local

# Copy the application code
COPY --from=builder /app /app

# Expose the port the app runs on
EXPOSE 8003

# Command to run the application with Gunicorn and Uvicorn workers
CMD ["gunicorn", "app.main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8003", \
     "--workers", "2"]