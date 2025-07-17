import { cn } from "@/lib/utils";

interface ContactTypeBadgeProps {
  type: string;
  className?: string;
}

export default function ContactTypeBadge({ type, className }: ContactTypeBadgeProps) {
  const getTypeStyles = () => {
    switch (type) {
      case "Client":
        return {
          background: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          dot: "bg-blue-400"
        };
      case "Internal":
        return {
          background: "bg-purple-50",
          border: "border-purple-200",
          text: "text-purple-700",
          dot: "bg-purple-400"
        };
      case "Vendor":
        return {
          background: "bg-green-50",
          border: "border-green-200",
          text: "text-green-700",
          dot: "bg-green-400"
        };
      case "Partner":
        return {
          background: "bg-indigo-50",
          border: "border-indigo-200",
          text: "text-indigo-700",
          dot: "bg-indigo-400"
        };
      case "Consultant":
        return {
          background: "bg-pink-50",
          border: "border-pink-200",
          text: "text-pink-700",
          dot: "bg-pink-400"
        };
      case "External Stakeholder":
        return {
          background: "bg-teal-50",
          border: "border-teal-200",
          text: "text-teal-700",
          dot: "bg-teal-400"
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

  const styles = getTypeStyles();

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
      {type}
    </div>
  );
}