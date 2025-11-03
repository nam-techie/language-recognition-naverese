import { useState, useRef } from "react";
import { Upload, FileVideo, Loader2, X } from "lucide-react";
import { predictVideo, PredictionResponse } from "@/lib/api";
import { toast } from "sonner";

interface FileUploadProps {
  onResult: (result: PredictionResponse) => void;
}

const ALLOWED_TYPES = ['video/mp4', 'video/avi', 'video/x-msvideo', 'video/quicktime', 'video/x-matroska'];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

export default function FileUpload({ onResult }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a valid video file (.mp4, .avi, .mov, .mkv)';
    }
    if (file.size > MAX_SIZE) {
      return 'File size must be less than 100MB';
    }
    return null;
  };

  const handleFile = (selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      toast.error(error);
      return;
    }
    setFile(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handlePredict = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const result = await predictVideo(file);
      onResult(result);
      toast.success('Prediction completed!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative glass-card rounded-xl p-8 transition-all ${
          dragActive ? 'ring-2 ring-primary scale-[1.02]' : ''
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4,.avi,.mov,.mkv"
          onChange={handleChange}
          className="hidden"
        />

        {!file ? (
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p className="text-foreground font-medium mb-2">
              Drop your video here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supported formats: MP4, AVI, MOV, MKV (Max 100MB)
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="gradient-button px-6 py-2 rounded-lg text-white font-medium"
            >
              Choose File
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <FileVideo className="w-10 h-10 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-medium truncate">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={clearFile}
              disabled={loading}
              className="p-2 hover:bg-destructive/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-destructive" />
            </button>
          </div>
        )}
      </div>

      {file && (
        <button
          onClick={handlePredict}
          disabled={loading}
          className="w-full gradient-button px-6 py-3 rounded-lg text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            'Predict'
          )}
        </button>
      )}
    </div>
  );
}
