# Start from a Python image that includes necessary base libraries
FROM python:3.10-slim-bullseye

# Install system dependencies for WeasyPrint (Cairo, Pango, GDK-Pixbuf)
# and other useful fonts.
RUN apt-get update && apt-get install -y \
    build-essential \
    libffi-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libgdk-pixbuf2.0-dev \
    libxml2-dev \
    libxslt1-dev \
    fonts-dejavu-core \
    fonts-liberation \
    fonts-noto \
    # Clean up APT cache to reduce image size
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file into the working directory
COPY requirements.txt .

# Install Python dependencies from requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the working directory
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]