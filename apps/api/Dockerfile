# ==============================================================================
# OpenPDF Platform - API Gateway Production Dockerfile
# Multi-stage, non-root, hardened Python 3.12 container
# ==============================================================================

FROM python:3.12-slim-bookworm AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install dependencies
COPY apps/api/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final Production Image
FROM python:3.12-slim-bookworm AS runner

# Install runtime dependencies & security utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create unprivileged system user
RUN groupadd -g 10001 pdfgroup && \
    useradd -u 10001 -g pdfgroup -s /bin/bash -m pdfuser

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /root/.local /home/pdfuser/.local
ENV PATH=/home/pdfuser/.local/bin:$PATH
ENV PYTHONPATH=/app

# Copy application source code
COPY --chown=pdfuser:pdfgroup apps/api /app/apps/api

USER 10001:10001

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health/liveness || exit 1

CMD ["uvicorn", "apps.api.src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers", "--forwarded-allow-ips", "*"]
