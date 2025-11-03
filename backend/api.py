import os
import tempfile
from typing import Any, Dict, List

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from inference_utils import (
    interpolate_keypoints,
    predict_from_sequence,
    predict_from_video_path,
)


app = FastAPI(title="VSL Recognition API")

# Configure CORS via env var: ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/predict-video")
async def predict_video(file: UploadFile = File(...)) -> Dict[str, Any]:
    filename_lower = file.filename.lower()
    # Accept common containers including webm from MediaRecorder
    if not filename_lower.endswith((".mp4", ".avi", ".mov", ".mkv", ".webm")):
        raise HTTPException(status_code=400, detail="Unsupported video format")

    with tempfile.NamedTemporaryFile(delete=False, suffix=filename_lower[filename_lower.rfind("."):]) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        idx, label, probs = predict_from_video_path(tmp_path)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    return {"index": idx, "label": label, "probs": probs.tolist()}


@app.post("/predict-sequence")
async def predict_sequence(payload: Dict[str, Any]) -> Dict[str, Any]:
    seq: List[List[float]] = payload.get("sequence")
    already_interpolated: bool = bool(payload.get("already_interpolated", False))

    if not isinstance(seq, list) or len(seq) == 0:
        raise HTTPException(status_code=400, detail="sequence required")

    frames = [np.array(frame, dtype=np.float32) for frame in seq]

    if already_interpolated:
        sequence_np = np.array(frames, dtype=np.float32)
        if sequence_np.ndim != 2:
            raise HTTPException(status_code=400, detail="invalid sequence shape")
    else:
        sequence_np = interpolate_keypoints(frames)
        if sequence_np is None:
            raise HTTPException(status_code=422, detail="interpolation failed")

    try:
        idx, label, probs = predict_from_sequence(sequence_np)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    return {"index": idx, "label": label, "probs": probs.tolist()}


# Run with: uvicorn api:app --host 0.0.0.0 --port 8000

