import { useState } from "react";
import Header from "@/components/Header";
import ModeToggle from "@/components/ModeToggle";
import FileUpload from "@/components/FileUpload";
import WebcamRecorder from "@/components/WebcamRecorder";
import ResultPanel from "@/components/ResultPanel";
import HealthIndicator from "@/components/HealthIndicator";
import { PredictionResponse } from "@/lib/api";

const Index = () => {
  const [mode, setMode] = useState<'video' | 'webcam'>('video');
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const handleResult = (newResult: PredictionResponse) => {
    setResult(newResult);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-24">
      <div className="w-full max-w-2xl">
        <Header />
        
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          <ModeToggle mode={mode} onModeChange={setMode} />
          
          {mode === 'video' ? (
            <FileUpload onResult={handleResult} />
          ) : (
            <WebcamRecorder onResult={handleResult} />
          )}

          {result && (
            <div className="mt-6">
              <ResultPanel result={result} />
            </div>
          )}
        </div>
      </div>

      <HealthIndicator />
    </div>
  );
};

export default Index;
