import { cn } from "@/lib/utils";

interface ServiceStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export default function ServiceStatusBadge({ isActive, className }: ServiceStatusBadgeProps) {
  const styles = isActive
    ? {
        background: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        dot: "bg-emerald-400"
      }
    : {
        background: "bg-slate-50",
        border: "border-slate-200",
        text: "text-slate-600",
        dot: "bg-slate-400"
      };

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
      {isActive ? "Active" : "Inactive"}
    </div>
  );
}