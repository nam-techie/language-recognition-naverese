import { Upload, Video } from "lucide-react";

interface ModeToggleProps {
  mode: 'video' | 'webcam';
  onModeChange: (mode: 'video' | 'webcam') => void;
}

export default function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => onModeChange('video')}
        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          mode === 'video'
            ? 'gradient-button text-white shadow-lg'
            : 'glass-card text-muted-foreground hover:text-foreground'
        }`}
      >
        <Upload className="w-5 h-5" />
        Video File
      </button>
      <button
        onClick={() => onModeChange('webcam')}
        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          mode === 'webcam'
            ? 'gradient-button text-white shadow-lg'
            : 'glass-card text-muted-foreground hover:text-foreground'
        }`}
      >
        <Video className="w-5 h-5" />
        Webcam
      </button>
    </div>
  );
}
