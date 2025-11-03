import { useState, useRef, useEffect } from "react";
import { Camera, Loader2, Circle } from "lucide-react";
import { predictVideo, PredictionResponse } from "@/lib/api";
import { toast } from "sonner";

interface WebcamRecorderProps {
  onResult: (result: PredictionResponse) => void;
}

export default function WebcamRecorder({ onResult }: WebcamRecorderProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      setStream(mediaStream);
      setPermissionDenied(false);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setPermissionDenied(true);
      toast.error('Camera access denied. Please allow camera access in your browser settings.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startRecording = async () => {
    if (!stream) return;
    // 2s chuẩn bị với đếm ngược
    setPreparing(true);
    let remain = 2;
    setCountdown(remain);
    const prepTimer = setInterval(() => {
      remain -= 1;
      setCountdown(remain);
      if (remain <= 0) {
        clearInterval(prepTimer);
        setPreparing(false);

        // Bắt đầu ghi hình 4s
        setRecording(true);
        chunksRef.current = [];

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm',
        });

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          await processPrediction(blob);
        };

        mediaRecorder.start();

        // Dừng sau 4s
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setRecording(false);
          }
        }, 4000);
      }
    }, 1000);
  };

  const processPrediction = async (blob: Blob) => {
    setLoading(true);
    try {
      const result = await predictVideo(blob);
      onResult(result);
      toast.success('Prediction completed!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  if (permissionDenied) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <Camera className="w-12 h-12 mx-auto mb-4 text-destructive" />
        <p className="text-foreground font-medium mb-2">Camera Access Required</p>
        <p className="text-sm text-muted-foreground mb-4">
          Please allow camera access in your browser settings and refresh the page.
        </p>
        <button
          onClick={startCamera}
          className="gradient-button px-6 py-2 rounded-lg text-white font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl overflow-hidden relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover bg-black"
        />
        {preparing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center text-white">
              <p className="text-lg mb-1">Đang chuẩn bị...</p>
              <p className="text-3xl font-semibold">Bắt đầu trong {countdown}s</p>
            </div>
          </div>
        )}
        {recording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-destructive/90 px-3 py-1.5 rounded-full">
            <Circle className="w-3 h-3 fill-white animate-pulse" />
            <span className="text-white text-sm font-medium">Recording...</span>
          </div>
        )}
      </div>

      <button
        onClick={startRecording}
        disabled={!stream || recording || loading || preparing}
        className="w-full gradient-button px-6 py-3 rounded-lg text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : preparing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Chuẩn bị ({countdown}s)...
          </>
        ) : recording ? (
          <>
            <Circle className="w-5 h-5 fill-white animate-pulse" />
            Recording (4s)...
          </>
        ) : (
          <>
            <Camera className="w-5 h-5" />
            Record 4s & Predict
          </>
        )}
      </button>
    </div>
  );
}
