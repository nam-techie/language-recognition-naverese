import { Hand } from "lucide-react";

export default function Header() {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-3">
        <Hand className="w-10 h-10 text-primary" />
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          LangRegC
        </h1>
      </div>
      <p className="text-muted-foreground text-lg">
        Vietnamese Sign Language Recognition
      </p>
    </div>
  );
}
