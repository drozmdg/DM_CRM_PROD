import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building,
  FolderPlus,
  Play,
  Settings,
  Calendar,
  Clock,
  User,
  FileText,
  Users,
  Wrench,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TimelineEventProps {
  event: {
    id: string;
    date: string;
    title: string;
    description: string;
    type: 'phase-change' | 'project-added' | 'process-launched' | 'other';
    icon?: string;
    customerId?: string;
    customerName?: string;
    processId?: string;
    processName?: string;
    entityType?: 'customer' | 'process' | 'document' | 'team' | 'service' | 'contact';
    metadata?: Record<string, any>;
  };
  isLast?: boolean;
  showActions?: boolean;
  onEdit?: (event: any) => void;
  onDelete?: (eventId: string) => void;
}

const eventIcons = {
  "phase-change": Building,
  "project-added": FolderPlus,
  "process-launched": Play,
  "other": Settings,
};

const eventColors = {
  "phase-change": "text-blue-600 bg-blue-100",
  "project-added": "text-green-600 bg-green-100",
  "process-launched": "text-purple-600 bg-purple-100",
  "other": "text-gray-600 bg-gray-100",
};

const entityTypeColors = {
  "customer": "bg-blue-100 text-blue-800",
  "process": "bg-purple-100 text-purple-800",
  "document": "bg-green-100 text-green-800",
  "team": "bg-orange-100 text-orange-800",
  "service": "bg-indigo-100 text-indigo-800",
  "contact": "bg-pink-100 text-pink-800",
};

const entityIcons = {
  "customer": Building,
  "process": Play,
  "document": FileText,
  "team": Users,
  "service": Wrench,
  "contact": User,
};

export default function TimelineEvent({ 
  event, 
  isLast = false, 
  showActions = true,
  onEdit,
  onDelete 
}: TimelineEventProps) {
  const Icon = eventIcons[event.type] || Settings;
  const EntityIcon = entityIcons[event.entityType || 'customer'];
  
  const formatEventType = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-6 top-16 w-0.5 h-20 bg-neutral-200"></div>
      )}
      
      <div className="flex space-x-4">
        {/* Timeline icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${eventColors[event.type]}`}>
          <Icon size={16} />
        </div>

        {/* Event content */}
        <div className="flex-1 min-w-0">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-neutral-800 truncate">{event.title}</h4>
                    {event.entityType && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${entityTypeColors[event.entityType]}`}
                      >
                        <EntityIcon size={10} className="mr-1" />
                        {event.entityType}
                      </Badge>
                    )}
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-neutral-600 mb-2 leading-relaxed">{event.description}</p>
                  )}

                  {/* Entity information */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {event.customerName && (
                      <div className="flex items-center text-xs text-neutral-500">
                        <Building size={12} className="mr-1" />
                        <span>{event.customerName}</span>
                      </div>
                    )}
                    
                    {event.processName && (
                      <div className="flex items-center text-xs text-neutral-500">
                        <Play size={12} className="mr-1" />
                        <span>{event.processName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {showActions && (onEdit || onDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(event)}>
                          Edit Event
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(event.id)}
                          className="text-destructive"
                        >
                          Delete Event
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              {/* Footer with metadata */}
              <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <Calendar size={12} className="mr-1" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    {formatEventType(event.type)}
                  </Badge>
                </div>
                
                <div className="flex items-center">
                  <Clock size={12} className="mr-1" />
                  <span>{getRelativeTime(event.date)}</span>
                </div>
              </div>

              {/* Additional metadata display */}
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <div className="mt-3 pt-2 border-t border-neutral-100">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(event.metadata).map(([key, value]) => {
                      if (key === 'customerId' || key === 'processId' || key === 'entityType') return null;
                      return (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}: {String(value)}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
