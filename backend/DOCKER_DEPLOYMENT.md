# Hướng dẫn Deploy Docker lên Azure App Service

## 📋 Tổng quan

Hướng dẫn này sẽ giúp bạn deploy ứng dụng VSL Backend lên Azure App Service sử dụng Docker container, đảm bảo ổn định và dễ quản lý hơn so với Oryx build.

---

## 🚀 Bước 1: Tạo Azure Container Registry (ACR)

### 1.1 Tạo ACR trong Azure Portal

1. Đăng nhập [Azure Portal](https://portal.azure.com)
2. Tạo resource mới → Tìm "Container Registry"
3. Click "Create"
4. Điền thông tin:
   - **Subscription**: Chọn subscription của bạn
   - **Resource Group**: Chọn resource group (hoặc tạo mới)
   - **Registry name**: Ví dụ `vslregistry` (phải unique, chỉ dùng chữ thường và số)
   - **Location**: Chọn location gần bạn
   - **SKU**: `Basic` (đủ cho development) hoặc `Standard` (cho production)
5. Click "Review + create" → "Create"

### 1.2 Lấy thông tin ACR

Sau khi tạo xong, vào ACR resource:

1. **Registry name**: Copy tên registry (ví dụ: `vslregistry.azurecr.io`)
2. **Admin user**: 
   - Vào "Settings" → "Access keys"
   - Bật "Admin user" → Copy **Username** và **Password**

---

## 🔐 Bước 2: Cấu hình GitHub Secrets

### 2.1 Thêm Secrets vào GitHub

1. Vào GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Thêm các secrets sau:

| Secret Name | Giá trị | Mô tả |
|------------|--------|-------|
| `AZURE_CONTAINER_REGISTRY` | `vslregistry.azurecr.io` | Tên ACR của bạn (thay bằng tên thực tế) |
| `AZURE_CONTAINER_REGISTRY_USERNAME` | `vslregistry` | Username từ ACR Access keys |
| `AZURE_CONTAINER_REGISTRY_PASSWORD` | `[password]` | Password từ ACR Access keys |

**Lưu ý**: Các secrets `AZUREAPPSERVICE_CLIENTID_*`, `AZUREAPPSERVICE_TENANTID_*`, `AZUREAPPSERVICE_SUBSCRIPTIONID_*` đã có sẵn từ cấu hình trước.

---

## ⚙️ Bước 3: Cấu hình Azure App Service

### 3.1 Chuyển App Service sang Docker

1. Vào Azure Portal → App Service `vsl-backend`
2. **Settings** → **Container settings**
3. Cấu hình:
   - **Image Source**: `Azure Container Registry`
   - **Registry**: Chọn ACR vừa tạo
   - **Image**: `vsl-backend`
   - **Tag**: `latest`
   - **Startup Command**: Để trống (Dockerfile đã có CMD)

### 3.2 Cấu hình Application Settings

1. **Configuration** → **Application settings**
2. Thêm/kiểm tra các settings:

| Setting Name | Giá trị | Mô tả |
|-------------|--------|-------|
| `WEBSITES_PORT` | `8000` | Port mà container expose |
| `ALLOWED_ORIGINS` | `https://your-frontend.azurewebsites.net` | CORS origins (nếu cần) |
| `TF_CPP_MIN_LOG_LEVEL` | `2` | Giảm TensorFlow logs |

### 3.3 Cấu hình Continuous Deployment (Tùy chọn)

1. **Deployment Center** → **Settings**
2. **Source**: `Container Registry`
3. **Registry**: Chọn ACR
4. **Image**: `vsl-backend:latest`
5. **Continuous Deployment**: Bật (tự động deploy khi có image mới)

---

## 🧪 Bước 4: Test Local Build (Tùy chọn)

Trước khi deploy, bạn có thể test build Docker image local:

```bash
# Di chuyển vào thư mục backend
cd backend

# Build image
docker build -t vsl-backend:local .

# Test chạy local
docker run -p 8000:8000 vsl-backend:local

# Test health check
curl http://localhost:8000/health
```

---

## 📤 Bước 5: Deploy qua GitHub Actions

### 5.1 Push code lên GitHub

```bash
git add .
git commit -m "Add Docker deployment configuration"
git push origin main
```

### 5.2 Kiểm tra GitHub Actions

1. Vào GitHub repository → **Actions** tab
2. Xem workflow run:
   - **build-and-push**: Build và push Docker image lên ACR
   - **deploy**: Deploy image lên Azure App Service

### 5.3 Kiểm tra Logs

Nếu có lỗi, xem logs trong:
- GitHub Actions logs
- Azure Portal → App Service → **Log stream**
- Azure Portal → App Service → **Container logs**

---

## 🔍 Troubleshooting

### Lỗi: "Cannot connect to Docker daemon"

**Nguyên nhân**: App Service chưa được cấu hình dùng Docker.

**Giải pháp**: 
- Kiểm tra **Container settings** đã được cấu hình chưa
- Đảm bảo **Image Source** là `Azure Container Registry`

### Lỗi: "Image not found"

**Nguyên nhân**: Image chưa được push lên ACR hoặc tên image sai.

**Giải pháp**:
- Kiểm tra GitHub Actions đã build và push image thành công chưa
- Vào ACR → **Repositories** → Kiểm tra có image `vsl-backend` không
- Kiểm tra tên image trong App Service Container settings khớp với ACR

### Lỗi: "Port 8000 not accessible"

**Nguyên nhân**: App Service không biết container expose port nào.

**Giải pháp**:
- Thêm Application Setting: `WEBSITES_PORT = 8000`
- Kiểm tra Dockerfile có `EXPOSE 8000` không

### Lỗi: "Container keeps restarting"

**Nguyên nhân**: Container crash do lỗi trong code hoặc dependencies.

**Giải pháp**:
- Xem **Container logs** trong Azure Portal
- Kiểm tra health check endpoint `/health` có hoạt động không
- Test build local trước khi deploy

---

## 📊 So sánh Docker vs Oryx

| Tiêu chí | Oryx Build | Docker |
|---------|-----------|--------|
| **Ổn định** | Phụ thuộc vào Azure Oryx | Hoàn toàn kiểm soát |
| **Debug** | Khó debug build process | Dễ debug local |
| **Dependencies** | Phụ thuộc vào Azure environment | Hoàn toàn độc lập |
| **Build time** | Nhanh hơn | Chậm hơn (nhưng có cache) |
| **Size** | Nhỏ hơn | Lớn hơn (nhưng có multi-stage) |
| **Portability** | Chỉ chạy trên Azure | Chạy mọi nơi |

---

## 🎯 Best Practices

1. **Docker Image Tags**: 
   - Dùng `latest` cho development
   - Dùng `git-sha` hoặc version tags cho production

2. **Docker Cache**: 
   - Workflow đã có cache configuration
   - Build sẽ nhanh hơn ở lần thứ 2

3. **Security**:
   - Không commit secrets vào code
   - Dùng GitHub Secrets cho tất cả credentials
   - Rotate ACR passwords định kỳ

4. **Monitoring**:
   - Bật Application Insights để monitor
   - Xem Container logs thường xuyên
   - Set up alerts cho container crashes

---

## 📚 Tài liệu tham khảo

- [Azure Container Registry Docs](https://docs.microsoft.com/azure/container-registry/)
- [Azure App Service Docker Docs](https://docs.microsoft.com/azure/app-service/quickstart-custom-container)
- [GitHub Actions Docker Docs](https://docs.github.com/actions/publishing-packages/publishing-docker-images)

---

## ✅ Checklist

Trước khi deploy, đảm bảo:

- [ ] Đã tạo Azure Container Registry
- [ ] Đã thêm GitHub Secrets (ACR credentials)
- [ ] Đã cấu hình App Service Container settings
- [ ] Đã test build Docker local (tùy chọn)
- [ ] Đã push code lên GitHub
- [ ] Đã kiểm tra GitHub Actions workflow chạy thành công
- [ ] Đã kiểm tra App Service logs không có lỗi
- [ ] Đã test API endpoint `/health` hoạt động

---

**Chúc bạn deploy thành công! 🎉**

