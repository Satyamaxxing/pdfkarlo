# ==============================================================================
# PDFKarlo Platform - Celery Background Processing Worker Dockerfile
# Hardened container with native QPDF / pikepdf engine bindings
# ==============================================================================

FROM python:3.12-slim-bookworm AS builder

WORKDIR /build

# Install build dependencies for C-extensions and QPDF bindings
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    qpdf \
    libqpdf-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python packages
COPY apps/worker/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final Production Image
FROM python:3.12-slim-bookworm AS runner

# Install runtime system libraries (QPDF runtime is required by pikepdf)
RUN apt-get update && apt-get install -y --no-install-recommends \
    qpdf \
    libqpdf29 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged system user
RUN groupadd -g 10001 celerygroup && \
    useradd -u 10001 -g celerygroup -s /bin/bash -m celeryuser

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /root/.local /home/celeryuser/.local
ENV PATH=/home/celeryuser/.local/bin:$PATH
ENV PYTHONPATH=/app

# Create scratch directory for temporary worker file processing
RUN mkdir -p /tmp/pdf_jobs && \
    chown -R celeryuser:celerygroup /tmp/pdf_jobs && \
    chmod 1777 /tmp/pdf_jobs

# Copy application source code
COPY --chown=celeryuser:celerygroup apps/worker /app/apps/worker
COPY --chown=celeryuser:celerygroup apps/api /app/apps/api

USER 10001:10001

CMD ["celery", "-A", "apps.worker.src.celery_app", "worker", "--loglevel=info", "--concurrency=4"]
