FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir --root-user-action=ignore -r requirements.txt

COPY backend/ .

EXPOSE 5000

ENV FLASK_ENV=production
ENV PORT=5000

CMD ["sh", "-c", "python seed.py && python run.py"]
