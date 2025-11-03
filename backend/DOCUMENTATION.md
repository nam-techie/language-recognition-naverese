## Vietnamese Sign Language Recognition — Tài liệu mô tả dự án

### 1) Tổng quan
- Dự án nhận diện Ngôn ngữ Ký hiệu Việt Nam (VSL) bằng học sâu và thị giác máy tính.
- Công nghệ chính: MediaPipe (trích xuất keypoints), TensorFlow/Keras (huấn luyện & suy luận), OpenCV (xử lý video), Streamlit (giao diện web).
- Hỗ trợ dự đoán từ video tải lên hoặc trực tiếp từ webcam.

### 2) Chức năng chính
- Nhận diện ký hiệu:
  - Dự đoán nhãn từ video `.mp4/.avi` do người dùng tải lên.
  - Dự đoán trực tiếp từ webcam (ghi ~4 giây rồi suy luận).
- Thu thập dữ liệu tự động:
  - Cào video từ `https://qipedc.moet.gov.vn`, lưu vào `Dataset/Videos` và tạo file nhãn `Dataset/Text/label.csv`.
- Tiền xử lý & Tăng cường dữ liệu:
  - Trích xuất keypoints pose + bàn tay, nội suy chuỗi về 60 frames, áp dụng augment (scale/rotate/translate/time-stretch, điều chỉnh khoảng cách hai tay bằng IK).
- Huấn luyện mô hình:
  - Sử dụng notebook `trainning.ipynb` để huấn luyện mô hình Keras từ dữ liệu đã xử lý.
- Giao diện người dùng:
  - Ứng dụng `Streamlit` dễ dùng, cho phép chọn nguồn vào, xem trước và hiển thị kết quả dự đoán.

### 3) Lợi ích
- Hỗ trợ cộng đồng khiếm thính thông qua công cụ nhận diện ký hiệu tự động.
- Quy trình end-to-end rõ ràng: Thu thập → Tiền xử lý/augment → Huấn luyện → Dự đoán.
- Dễ triển khai trên Windows; có sẵn mô hình mẫu để chạy ngay.
- Kiến trúc mô-đun, dễ mở rộng nhãn, thuật toán và UI.

### 4) Cách thức hoạt động (Pipeline)
1. Đầu vào: video hoặc webcam.
2. Trích xuất đặc trưng: MediaPipe Holistic phát hiện pose và hai bàn tay → ghép 25 pose + 21 tay trái + 21 tay phải → phẳng hoá mỗi frame.
3. Chuẩn hoá chuỗi: nội suy chuỗi keypoints về độ dài cố định 60 frames.
4. Suy luận: mô hình Keras (`Models/checkpoints/final_model.keras`) nhận tensor (60, features) → trả về xác suất lớp → lấy nhãn theo `Logs/label_map.json`.
5. Giao diện: Streamlit hiển thị video/webcam, nút dự đoán và kết quả.

Sơ đồ thành phần chính:
- `main.py`: Ứng dụng Streamlit (nạp model & label_map, xử lý video/webcam, suy luận).
- `download_data.py`: Selenium + Requests cào video và cập nhật `label.csv`.
- `create_data_augment.py`: Trích xuất keypoints, nội suy, augment, xuất dữ liệu `.npz` theo từng nhãn.
- `augment_function.py`: Tập các hàm augment hình học/thời gian và IK tay.

### 5) Cài đặt & Thiết lập

#### Yêu cầu hệ thống
- Python 3.8+
- Windows 10/11
- Google Chrome (phục vụ cào dữ liệu bằng Selenium, nếu dùng)
- Webcam (nếu dự đoán từ webcam)
- GPU khuyến nghị cho huấn luyện

#### Cài dependency
```bash
# (Khuyến nghị) Tạo môi trường ảo
python -m venv .venv
\.\.venv\Scripts\activate

# Cài thư viện
pip install --upgrade pip
pip install -r requirements.txt
```

Nếu dùng GPU: cài TensorFlow GPU tương thích (CUDA/cuDNN phù hợp với phiên bản TensorFlow trong môi trường của bạn).

#### Cấu trúc thư mục quan trọng
- `main.py`: App Streamlit dự đoán video/webcam
- `Models/checkpoints/final_model.keras`: Mô hình Keras đã huấn luyện
- `Logs/label_map.json`: Bản đồ nhãn (label ↔ id)
- `Dataset/Videos`: Video gốc (từ quá trình cào dữ liệu)
- `Dataset/Text/label.csv`: Bảng nhãn video
- `Data/`: Dữ liệu đã xử lý (npz) để huấn luyện
- `download_data.py`: Cào & tải video + cập nhật nhãn
- `create_data_augment.py`: Tiền xử lý, augment và sinh dữ liệu
- `augment_function.py`: Hàm augment (scale/rotate/translate/time-stretch/IK)
 - `backend/`: Mã nguồn BE FastAPI (`backend/api.py`, `backend/inference_utils.py`)
 - `frontend/`: Nơi đặt mã nguồn FE UI (README hướng dẫn)

### 6) Cách chạy nhanh (Quickstart)
```bash
# 1) Cài dependency
python -m venv .venv
\.\.venv\Scripts\activate
pip install -r requirements.txt

# 2) Chạy ứng dụng với mô hình sẵn có
streamlit run main.py
```

Trên giao diện Streamlit:
- Chế độ “Video file”: tải video `.mp4/.avi` và bấm “Dự đoán”.
- Chế độ “Webcam”: bấm “Ghi và dự đoán” (ghi ~4 giây), cho phép truy cập webcam.

Yêu cầu tệp tồn tại (nếu chạy bằng mô hình mẫu):
- `Models/checkpoints/final_model.keras`
- `Logs/label_map.json`

### 7) Huấn luyện từ đầu (tuỳ chọn)

1) Thu thập dữ liệu
```bash
python download_data.py
```
Kết quả: video lưu ở `Dataset/Videos` và `Dataset/Text/label.csv` được tạo/cập nhật.

Lưu ý: cần Chrome. Script sẽ tự tải `chromedriver-win64/chromedriver.exe` nếu chưa có.

2) Tiền xử lý & Tăng cường dữ liệu
```bash
python create_data_augment.py
```
Kết quả: sinh dữ liệu `.npz` theo từng nhãn vào `Data/<label>/` và tạo/cập nhật `Logs/label_map.json`.

3) Huấn luyện mô hình
- Mở notebook `trainning.ipynb` bằng Jupyter và chạy toàn bộ cell.
- Lưu mô hình vào `Models/checkpoints/final_model.keras`.

4) Chạy ứng dụng
```bash
streamlit run main.py
```

### 8) Chạy Backend API (FastAPI) 

# trong thư mục backend
$env:ALLOWED_ORIGINS="http://localhost:5173,http://localhost:8080"; uvicorn api:app --host 0.0.0.0 --port 8000


#### Cài thêm phụ thuộc API
```bash
python -m pip install fastapi uvicorn python-multipart
```

#### Khởi động API
```bash
uvicorn api:app --host 0.0.0.0 --port 8000
```

#### Endpoints
- `GET /health` → kiểm tra trạng thái.
- `POST /predict-video` (multipart/form-data: `file`) → upload video (`.mp4/.avi/.mov/.mkv`), trả `{ index, label, probs }`.
- `POST /predict-sequence` (application/json) → body:
```json
{
  "sequence": [[...], [...], ...],
  "already_interpolated": false
}
```
Trả `{ index, label, probs }`. Nếu `already_interpolated=true`, `sequence` phải là ma trận 2D (60 x features).

Frontend riêng có thể gọi trực tiếp các endpoint này. Khi triển khai thực, giới hạn `allow_origins` trong CORS tại `api.py` theo domain FE của bạn.

### 9) Tuỳ chỉnh & Thiết lập nâng cao
- Đường dẫn mô hình/nhãn: chỉnh trong `main.py` (hàm `load_model`, `load_label_map`) nếu thay đổi vị trí.
- Tham số MediaPipe: `min_detection_confidence`, `min_tracking_confidence` khai báo trong `main.py` và `create_data_augment.py`.
- Độ dài chuỗi: `interpolate_keypoints(..., target_len=60)` đang cố định 60; nếu thay đổi, cần đồng bộ với mô hình và dữ liệu huấn luyện.
- Augment: thay đổi danh sách `augmentations` và thông số trong `create_data_augment.py` (ví dụ `num_samples_to_generate=1000`, `max_augs_per_sample=5`).

### 10) Xử lý sự cố thường gặp
- Không nhận webcam: kiểm tra quyền truy cập webcam của trình duyệt và đảm bảo không ứng dụng nào khác đang dùng webcam.
- Thiếu mô hình/nhãn: xác nhận tồn tại `Models/checkpoints/final_model.keras` và `Logs/label_map.json`.
- Lỗi Selenium/ChromeDriver: cập nhật Chrome; xoá `chromedriver-win64` rồi chạy lại `python download_data.py`.
- TensorFlow GPU không khớp: đảm bảo phiên bản CUDA/cuDNN tương thích; nếu khó, dùng TensorFlow CPU theo `requirements.txt`.

### 11) Bản quyền và ghi công
- Dự án phục vụ mục đích nghiên cứu và giáo dục về nhận diện Ngôn ngữ Ký hiệu Việt Nam.
- Vui lòng trích dẫn tác giả/nguồn khi sử dụng hoặc dẫn xuất.


