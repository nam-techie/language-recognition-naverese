# LangRegC Backend (FastAPI)

Run API locally:

```bash
python -m pip install fastapi uvicorn python-multipart
uvicorn backend.api:app --host 0.0.0.0 --port 8000
```

Endpoints:
- GET `/health`
- POST `/predict-video` (multipart `file`) → `{ index, label, probs }`
- POST `/predict-sequence` (JSON `{ sequence, already_interpolated }`) → `{ index, label, probs }`

Notes:
- API loads model from `Models/checkpoints/final_model.keras` and labels from `Logs/label_map.json` at project root.
- Adjust CORS in `backend/api.py` for production domains.


## Windows Quickstart (PowerShell)

```powershell
# 1) (Khuyến nghị) tạo và kích hoạt venv tại thư mục backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2) Cài thư viện BE (hoặc dùng requirements ở project root nếu muốn)
python -m pip install --upgrade pip
python -m pip install fastapi uvicorn python-multipart
# (Tuỳ chọn) nếu bạn chạy cả pipeline TF/TFLite: pip install -r ..\requirements.txt

# 3) Cấu hình CORS cho FE local (tuỳ chọn nhưng khuyến nghị khi test)
$env:ALLOWED_ORIGINS = "http://localhost:5173,http://localhost:8080"

# 4a) Chạy từ thư mục backend
uvicorn api:app --host 0.0.0.0 --port 8000

# 4b) Hoặc chạy từ project root
# uvicorn backend.api:app --host 0.0.0.0 --port 8000
```

Kiểm tra dịch vụ hoạt động:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/health
# Kỳ vọng: HTTP 200 OK
```

## Gọi thử endpoint

### 1) Dự đoán từ video (multipart/form-data)
Tránh lỗi 422, đảm bảo trường tên `file` và `Content-Type` đúng.

```bash
curl -X POST http://127.0.0.1:8000/predict-video \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample.mp4"
```

### 2) Dự đoán từ chuỗi keypoints (JSON)

```bash
curl -X POST http://127.0.0.1:8000/predict-sequence \
  -H "Content-Type: application/json" \
  -d '{
    "sequence": [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]],
    "already_interpolated": false
  }'
```

## Lưu ý & Khắc phục sự cố

- 422 Unprocessable Entity khi gọi `/predict-video`: thường do thiếu trường `file` hoặc gửi sai dạng `multipart/form-data`.
- Thiếu model/nhãn: cần `Models/checkpoints/final_model.keras` và `Logs/label_map.json` ở project root.
- CORS khi gọi từ FE: đặt biến môi trường `ALLOWED_ORIGINS` như ví dụ ở trên hoặc chỉnh trong `backend/api.py`.
- Chạy đúng đường dẫn module:
  - Từ project root: `uvicorn backend.api:app ...`
  - Từ thư mục `backend/`: `uvicorn api:app ...`
