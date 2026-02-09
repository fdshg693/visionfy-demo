
# ── Stage 1: Build wheels ──────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

# Build tools needed to compile C extensions (e.g. numpy, opencv)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 1) CPU-only PyTorch wheels (skip ~2 GB of CUDA libs)
RUN pip wheel --wheel-dir=/wheels --no-cache-dir \
    torch torchvision \
    --index-url https://download.pytorch.org/whl/cpu

# 2) Remaining deps — exclude torch/torchvision so pip won't re-fetch CUDA versions
RUN grep -viE '^\s*(torch|torchvision)\s*$' requirements.txt > requirements-filtered.txt && \
    pip wheel --wheel-dir=/wheels --no-cache-dir \
    --find-links=/wheels \
    -r requirements-filtered.txt


# ── Stage 2: Runtime (no gcc, no build tools) ──────────────────────
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=True
ENV APP_HOME=/app
ENV PORT=8080

WORKDIR $APP_HOME

# Runtime-only system libraries for OpenCV / GUI-less rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1 \
    libxcb1 \
    && rm -rf /var/lib/apt/lists/*

# Install from pre-built wheels only (no index, no compilation)
COPY --from=builder /wheels /wheels
COPY requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/wheels \
    -r requirements.txt \
    && rm -rf /wheels

# Copy application source
COPY src/ ./src/
WORKDIR $APP_HOME/src

# gunicorn: 1 worker, 8 threads, no timeout (Cloud Run manages scaling)
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app
