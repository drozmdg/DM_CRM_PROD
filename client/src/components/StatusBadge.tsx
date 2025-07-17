import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "In Progress":
        return {
          background: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          dot: "bg-amber-400"
        };
      case "Completed":
        return {
          background: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-700",
          dot: "bg-emerald-400"
        };
      case "Not Started":
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

  const styles = getStatusStyles();

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
      {status}
    </div>
  );
}