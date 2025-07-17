import { cn } from "@/lib/utils";

interface SDLCStageBadgeProps {
  stage: string;
  className?: string;
}

export default function SDLCStageBadge({ stage, className }: SDLCStageBadgeProps) {
  const getStageStyles = () => {
    switch (stage) {
      case "Requirements":
        return {
          background: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          dot: "bg-blue-400"
        };
      case "Design":
        return {
          background: "bg-purple-50",
          border: "border-purple-200",
          text: "text-purple-700",
          dot: "bg-purple-400"
        };
      case "Development":
        return {
          background: "bg-indigo-50",
          border: "border-indigo-200",
          text: "text-indigo-700",
          dot: "bg-indigo-400"
        };
      case "Testing":
        return {
          background: "bg-orange-50",
          border: "border-orange-200",
          text: "text-orange-700",
          dot: "bg-orange-400"
        };
      case "Deployment":
        return {
          background: "bg-teal-50",
          border: "border-teal-200",
          text: "text-teal-700",
          dot: "bg-teal-400"
        };
      case "Maintenance":
        return {
          background: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-700",
          dot: "bg-emerald-400"
        };
      default:
        return {
          background: "bg-gray-50",
          border: "border-gray-200",
          text: "text-gray-600",
          dot: "bg-gray-400"
        };
    }
  };

  const styles = getStageStyles();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
        styles.background,
        styles.border,
        styles.text,
        "border",
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", styles.dot)} />
      {stage}
    </div>
  );
}