import json
import os
import tempfile
from typing import List, Optional, Tuple

import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
from scipy.interpolate import interp1d


# ===== Constants =====
mp_holistic = mp.solutions.holistic
N_UPPER_BODY_POSE_LANDMARKS = 25
N_HAND_LANDMARKS = 21
N_TOTAL_LANDMARKS = N_UPPER_BODY_POSE_LANDMARKS + 2 * N_HAND_LANDMARKS


# ===== Model / Label map singletons =====
_MODEL: Optional[tf.keras.Model] = None
_LABEL_MAP: Optional[dict] = None
_INV_LABEL_MAP: Optional[dict] = None


def load_model(model_path: str = "Models/checkpoints/final_model.keras") -> tf.keras.Model:
    global _MODEL
    if _MODEL is None:
        _MODEL = tf.keras.models.load_model(model_path)
    return _MODEL


def load_label_maps(label_map_path: str = "Logs/label_map.json") -> Tuple[dict, dict]:
    global _LABEL_MAP, _INV_LABEL_MAP
    if _LABEL_MAP is None or _INV_LABEL_MAP is None:
        with open(label_map_path, 'r', encoding='utf-8') as f:
            _LABEL_MAP = json.load(f)
        _INV_LABEL_MAP = {v: k for k, v in _LABEL_MAP.items()}
    return _LABEL_MAP, _INV_LABEL_MAP


# ===== Pre/Post processing =====
def mediapipe_detection(image: np.ndarray, holistic) -> Tuple[np.ndarray, object]:
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image.flags.writeable = False
    results = holistic.process(image)
    image.flags.writeable = True
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    return image, results


def extract_keypoints(results) -> np.ndarray:
    pose_kps = np.zeros((N_UPPER_BODY_POSE_LANDMARKS, 3))
    left_hand_kps = np.zeros((N_HAND_LANDMARKS, 3))
    right_hand_kps = np.zeros((N_HAND_LANDMARKS, 3))

    if results and results.pose_landmarks:
        for i in range(N_UPPER_BODY_POSE_LANDMARKS):
            if i < len(results.pose_landmarks.landmark):
                res = results.pose_landmarks.landmark[i]
                pose_kps[i] = [res.x, res.y, res.z]
    if results and results.left_hand_landmarks:
        left_hand_kps = np.array([[res.x, res.y, res.z] for res in results.left_hand_landmarks.landmark])
    if results and results.right_hand_landmarks:
        right_hand_kps = np.array([[res.x, res.y, res.z] for res in results.right_hand_landmarks.landmark])

    keypoints = np.concatenate([pose_kps, left_hand_kps, right_hand_kps])
    return keypoints.flatten()


def interpolate_keypoints(keypoints_sequence: List[np.ndarray], target_len: int = 60) -> Optional[np.ndarray]:
    if len(keypoints_sequence) == 0:
        return None

    original_times = np.linspace(0, 1, len(keypoints_sequence))
    target_times = np.linspace(0, 1, target_len)

    num_features = keypoints_sequence[0].shape[0]
    interpolated_sequence = np.zeros((target_len, num_features))

    for feature_idx in range(num_features):
        feature_values = [frame[feature_idx] for frame in keypoints_sequence]
        interpolator = interp1d(
            original_times,
            feature_values,
            kind='cubic',
            bounds_error=False,
            fill_value="extrapolate",
        )
        interpolated_sequence[:, feature_idx] = interpolator(target_times)

    return interpolated_sequence


def sequence_frames(video_path: str) -> List[np.ndarray]:
    sequence: List[np.ndarray] = []
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    step = max(1, total_frames // 100)

    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if int(cap.get(cv2.CAP_PROP_POS_FRAMES)) % step != 0:
                continue
            _, results = mediapipe_detection(frame, holistic)
            keypoints = extract_keypoints(results)
            if keypoints is not None:
                sequence.append(keypoints)

    cap.release()
    return sequence


# ===== Inference helpers =====
def predict_from_sequence(sequence: np.ndarray) -> Tuple[int, str, np.ndarray]:
    model = load_model()
    _, inv_label_map = load_label_maps()
    preds = model.predict(np.expand_dims(sequence, axis=0))
    idx = int(np.argmax(preds, axis=1)[0])
    label = inv_label_map.get(idx, str(idx))
    return idx, label, preds[0]


def predict_from_video_path(video_path: str) -> Tuple[int, str, np.ndarray]:
    frames = sequence_frames(video_path)
    interp = interpolate_keypoints(frames)
    if interp is None:
        raise ValueError("No keypoints detected or interpolation failed")
    return predict_from_sequence(interp)


