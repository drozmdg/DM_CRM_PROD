/**
 * System Prompt Viewer Component
 * 
 * This component displays the current system prompt being sent to the AI.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateSystemPrompt } from "@/lib/ai-chat";

interface SystemPromptViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SystemPromptViewer: React.FC<SystemPromptViewerProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();

  const systemPrompt = generateSystemPrompt();

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(systemPrompt);
      toast({
        title: "Copied!",
        description: "System prompt copied to clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            System Prompt Viewer
          </DialogTitle>
          <DialogDescription>
            View the exact system prompt and CRM data context being sent to the AI model.
            This helps you understand how the AI generates responses based on your current data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              System prompt length: {systemPrompt.length} characters
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyPrompt}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Prompt
            </Button>
          </div>
          
          <ScrollArea className="flex-1 border rounded-md p-4 bg-muted/50">
            <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed">
              {systemPrompt}
            </pre>
          </ScrollArea>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SystemPromptViewer;
