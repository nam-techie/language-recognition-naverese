# Sử dụng Python 3.11 slim image để giảm kích thước
FROM python:3.11-slim

# Đặt working directory
WORKDIR /app

# Cài đặt system dependencies cần thiết cho OpenCV và MediaPipe
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy file requirements trước để tận dụng Docker cache
COPY requirements.txt .

# Cài đặt Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code ứng dụng
COPY . .

# Tạo thư mục cho temp files (nếu cần)
RUN mkdir -p /tmp

# Expose port 8000 (Azure App Service sẽ map port này)
EXPOSE 8000

# Set environment variables để tối ưu TensorFlow
ENV TF_CPP_MIN_LOG_LEVEL=2
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Khởi động ứng dụng
CMD ["python", "-m", "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]

