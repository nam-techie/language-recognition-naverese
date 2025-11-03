import { PredictionResponse } from "@/lib/api";
import { TrendingUp } from "lucide-react";

interface ResultPanelProps {
  result: PredictionResponse;
}

export default function ResultPanel({ result }: ResultPanelProps) {
  const getTopProbabilities = () => {
    if (!result.probs || result.probs.length === 0) return [];
    
    const probsWithIndex = result.probs.map((prob, index) => ({ prob, index }));
    probsWithIndex.sort((a, b) => b.prob - a.prob);
    return probsWithIndex.slice(0, 3);
  };

  const topProbs = getTopProbabilities();

  return (
    <div className="glass-card rounded-xl p-6 space-y-6 animate-in fade-in duration-500">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Top Prediction</p>
        <div className="inline-flex items-center gap-2 px-6 py-3 gradient-button rounded-full">
          <TrendingUp className="w-5 h-5 text-white" />
          <span className="text-2xl font-bold text-white">{result.label}</span>
        </div>
      </div>

      {topProbs.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">Top 3 Probabilities</p>
          {topProbs.map(({ prob, index }, rank) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-foreground font-medium">
                  {rank === 0 ? result.label : `Class ${index}`}
                </span>
                <span className="text-primary font-semibold">
                  {(prob * 100).toFixed(2)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 rounded-full"
                  style={{ width: `${prob * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-4 border-t border-border/50 text-center">
        <p className="text-xs text-muted-foreground">
          Index: <span className="font-mono text-foreground">{result.index}</span>
        </p>
      </div>
    </div>
  );
}
