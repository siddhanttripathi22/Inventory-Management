# Lightweight official Python image (slim = no build toolchain bloat).
FROM python:3.12-slim

# Keep Python lean and logs unbuffered so they show up immediately in Docker.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies FIRST, in their own layer. Docker caches this layer and
# only re-runs pip when requirements.txt changes — not on every code edit.
# psycopg[binary] ships prebuilt wheels, so no gcc/libpq-dev system packages
# are needed, which keeps the image small.
COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code.
COPY app ./app

# Run as a non-root user — a basic but important production hardening step.
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

# 0.0.0.0 (not 127.0.0.1) so the server is reachable from outside the container.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
