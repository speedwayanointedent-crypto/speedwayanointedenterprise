import React from "react";
import { Loader2 } from "lucide-react";

type LoadingSpinnerProps = {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = "Loading...",
  size = "md",
  className = ""
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`btn-spinner text-primary ${sizeClasses[size]}`} />
      {text && (
        <p className={`text-muted-foreground ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

export const PageLoading: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingSpinner text={text || "Loading page..."} size="lg" />
    </div>
  );
};
