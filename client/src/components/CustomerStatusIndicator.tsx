import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Play,
  Pause
} from "lucide-react";

interface CustomerStatusIndicatorProps {
  phase: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function CustomerStatusIndicator({ 
  phase, 
  showIcon = true, 
  size = "md" 
}: CustomerStatusIndicatorProps) {
  const getStatusConfig = (phase: string) => {
    switch (phase) {
      case "New Activation":
        return {
          color: "bg-success/10 text-success border-success/20",
          icon: Play,
          description: "Customer onboarding in progress"
        };
      case "Steady State":
        return {
          color: "bg-primary/10 text-primary border-primary/20",
          icon: CheckCircle,
          description: "Stable ongoing relationship"
        };
      case "Contracting":
        return {
          color: "bg-warning/10 text-warning border-warning/20",
          icon: Clock,
          description: "Contract negotiation phase"
        };
      case "Steady State + New Activation":
        return {
          color: "bg-blue-100 text-blue-700 border-blue-200",
          icon: Play,
          description: "Expanding services"
        };
      case "Pending Termination":
        return {
          color: "bg-destructive/10 text-destructive border-destructive/20",
          icon: AlertTriangle,
          description: "Contract ending soon"
        };
      case "Terminated":
        return {
          color: "bg-muted text-muted-foreground border-muted/20",
          icon: XCircle,
          description: "Relationship ended"
        };
      default:
        return {
          color: "bg-muted text-muted-foreground border-muted/20",
          icon: Pause,
          description: "Unknown status"
        };
    }
  };

  const sizeConfig = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };

  const iconSizeConfig = {
    sm: 12,
    md: 14,
    lg: 16
  };

  const config = getStatusConfig(phase);
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${sizeConfig[size]} flex items-center space-x-1`}
      title={config.description}
    >
      {showIcon && <Icon size={iconSizeConfig[size]} />}
      <span>{phase}</span>
    </Badge>
  );
}
