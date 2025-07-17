import { cn } from "@/lib/utils";

interface CustomerPhaseBadgeProps {
  phase: string;
  className?: string;
}

export default function CustomerPhaseBadge({ phase, className }: CustomerPhaseBadgeProps) {
  const getPhaseStyles = () => {
    switch (phase) {
      case "New Activation":
        return {
          background: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-700",
          dot: "bg-emerald-400"
        };
      case "Steady State":
        return {
          background: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          dot: "bg-blue-400"
        };
      case "Steady State + New Activation":
        return {
          background: "bg-cyan-50",
          border: "border-cyan-200",
          text: "text-cyan-700",
          dot: "bg-cyan-400"
        };
      case "Contracting":
        return {
          background: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          dot: "bg-amber-400"
        };
      case "Pending Termination":
        return {
          background: "bg-orange-50",
          border: "border-orange-200",
          text: "text-orange-700",
          dot: "bg-orange-400"
        };
      case "Terminated":
        return {
          background: "bg-slate-50",
          border: "border-slate-200",
          text: "text-slate-600",
          dot: "bg-slate-400"
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

  const styles = getPhaseStyles();

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
      {phase}
    </div>
  );
}