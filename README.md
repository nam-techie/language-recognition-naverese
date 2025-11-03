# VIETNAMESE SIGN LANGUAGE RECOGNITION
A system for recognizing Vietnamese Sign Language using deep learning and computer vision techniques, tailored specifically for Vietnamese sign language.
## Demo
https://github.com/user-attachments/assets/c143c7f2-9a7c-4033-9c41-a196322e6b5d
## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Requirements](#requirements)
- [Local Development (Backend + Frontend)](#local-development-backend--frontend)
- [Streamlit Test (optional)](#streamlit-test-optional)
- [Training from Scratch](#training-from-scratch)
## Overview
The Vietnamese Sign Language Recognition system leverages deep learning models and computer vision to interpret Vietnamese sign language gestures. It uses MediaPipe for landmark detection, TensorFlow for model training, and Streamlit for a user-friendly interface. The system supports recognition through video files or live webcam feeds.
## Features
- Automated Video Download: Automatically downloads videos for training data.
- Data Preprocessing: Processes and augments data for model training.
- Sign Language Recognition: Recognizes Vietnamese sign language gestures via video or webcam input.
- User Interface: Provides a Streamlit-based web interface for easy interaction.
## Requirements
- **Software**:
    - Python 3.8 or higher
    - TensorFlow 2.x
    - Scikit-learn
    - MediaPipe
    - OpenCV
    - Streamlit
- **Hardware**:
    - Webcam (required for webcam recognition)
    - GPU (recommended for model training)
## Local Development (Backend + Frontend)

### 1) Clone the repository
```bash
git clone https://github.com/photienanh/Vietnamese-Sign-Language-Recognition
cd Vietnamese-Sign-Language-Recognition
```
Alternatively, download the ZIP file from GitHub and extract it.

### 2) Backend (FastAPI) – Terminal 1
```powershell
cd backend
py -3.10 -m venv .venv
\.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# allow Vite dev origin (5173) – adjust if your FE runs elsewhere
$env:ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"

uvicorn backend.api:app --host 0.0.0.0 --port 8000
```

### 3) Frontend (Vite) – Terminal 2
```powershell
cd frontend
# Create .env.development (or .env.local)
"VITE_API_BASE_URL=http://localhost:8000" | Out-File -Encoding utf8 .env.development

npm i
npm run dev
# FE will run on http://localhost:5173 by default
```

Notes
- If you see CORS errors, ensure your FE origin is included in `ALLOWED_ORIGINS` when running the backend.
- Prefer Python 3.10 for MediaPipe/TensorFlow compatibility. If you used Python 3.13 and hit install issues, switch the venv to 3.10.

## Streamlit Test (optional)
You can still run the original Streamlit demo (now inside `backend/`) to quickly test the pre-trained model locally:
```powershell
cd backend
python -m pip install -r requirements.txt
python -m streamlit run main.py
```
This launches a simple UI where you can upload videos or use a webcam for sign language recognition.
### Training from Scratch
To train a new model, follow these steps:
1. Clear Previous Data (optional).
```bash
Get-ChildItem -Path "./" -Directory | Remove-Item -Recurse -Force
```
2. Download Training Data.
```bash
cd backend
python download_data.py
```

3. Process Data.
```bash
python create_data_augment.py
```

4. Train the Model.
- Open ```training.ipynb``` in a Jupyter Notebook environment.
- Run all cells to train the model.
- Note: Training is computationally intensive and best performed on a GPU-enabled device.
5. Run the Application (choose one):
```powershell
# Streamlit test UI
python -m streamlit run main.py

# or Backend API for your external FE
uvicorn backend.api:app --host 0.0.0.0 --port 8000
```
