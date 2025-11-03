const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface PredictionResponse {
  index: number;
  label: string;
  probs?: number[];
}

export interface HealthResponse {
  status: string;
}

export async function getHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data: HealthResponse = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

export async function predictVideo(file: File | Blob): Promise<PredictionResponse> {
  const formData = new FormData();
  // Nếu là Blob từ MediaRecorder (webm), đặt tên hợp lý để backend/opencv đọc đúng container
  const filename = file instanceof Blob && !(file instanceof File) ? 'webcam.webm' : (file as File).name;
  formData.append('file', file, filename);

  const response = await fetch(`${API_BASE_URL}/predict-video`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Prediction failed: ${errorText}`);
  }

  return response.json();
}

export async function predictSequence(sequence: number[][], alreadyInterpolated: boolean = false): Promise<PredictionResponse> {
  const response = await fetch(`${API_BASE_URL}/predict-sequence`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sequence,
      already_interpolated: alreadyInterpolated,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Prediction failed: ${errorText}`);
  }

  return response.json();
}
