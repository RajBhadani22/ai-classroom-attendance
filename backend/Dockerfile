FROM python:3.11-slim

# System dependencies required by dlib (used by face_recognition)
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        cmake \
        libopenblas-dev \
        liblapack-dev \
        libx11-dev \
        libgtk-3-dev \
        libboost-python-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create upload directories
RUN mkdir -p uploads/students uploads/sessions

ENV DATABASE_URL=sqlite:///./attendance.db
ENV UPLOAD_DIR=./uploads
ENV MAX_FILE_SIZE=10485760
ENV FACE_RECOGNITION_TOLERANCE=0.5

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
