import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Send, User, X, Minimize2, Maximize2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleMinimize?: () => void;
  isMinimized?: boolean;
}

export default function AIAssistant({ 
  isOpen, 
  onClose, 
  onToggleMinimize, 
  isMinimized = false 
}: AIAssistantProps) {
  const [messageInput, setMessageInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sessions } = useQuery({
    queryKey: ["/api/chat/sessions"],
    enabled: isOpen,
  });

  const { data: messages } = useQuery({
    queryKey: ["/api/chat/sessions", currentSessionId, "messages"],
    enabled: !!currentSessionId && isOpen,
  });

  // Create a session if none exists
  useEffect(() => {
    if (isOpen && sessions && sessions.length === 0) {
      createSessionMutation.mutate({
        title: "AI Assistant Chat",
        model: "llama2",
        systemPrompt: "You are an AI assistant integrated with a CRM system. Help users with customer insights, process management, and data analysis.",
      });
    } else if (sessions && sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [isOpen, sessions, currentSessionId]);

  const createSessionMutation = useMutation({
    mutationFn: async (data: { title?: string; model?: string; systemPrompt?: string }) => {
      const response = await apiRequest("POST", "/api/chat/sessions", data);
      return response.json();
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      setCurrentSessionId(session.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create chat session",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { role: string; content: string }) => {
      const response = await apiRequest("POST", `/api/chat/sessions/${currentSessionId}/messages`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/chat/sessions", currentSessionId, "messages"] 
      });
      setMessageInput("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentSessionId) return;

    // Send user message
    await sendMessageMutation.mutateAsync({
      role: "user",
      content: messageInput,
    });

    // Simulate AI response (in a real app, this would be handled by the backend with Ollama)
    setTimeout(async () => {
      const responses = [
        "I can help you analyze your CRM data. What specific information are you looking for?",
        "Based on your customer data, I can provide insights about trends, process efficiency, and potential opportunities.",
        "I have access to your customer information, processes, and timeline data. How can I assist you today?",
        "Let me analyze your current customer relationships and processes to provide you with actionable insights.",
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      await sendMessageMutation.mutateAsync({
        role: "assistant",
        content: randomResponse,
      });
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className={`fixed ${isMinimized ? 'bottom-24 right-6 w-80 h-16' : 'bottom-24 right-6 w-80 h-96'} z-40 transition-all duration-200`}>
      <Card className="h-full flex flex-col shadow-xl border border-neutral-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                <Bot className="text-accent" size={16} />
              </div>
              <h3 className="font-medium text-neutral-800">AI Assistant</h3>
            </div>
            <div className="flex items-center space-x-1">
              {onToggleMinimize && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onToggleMinimize}
                  className="p-1 h-auto"
                >
                  {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="p-1 h-auto"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {!messages || messages.length === 0 ? (
                <div className="text-center py-4">
                  <Bot className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-600">
                    Hello! I'm your AI assistant. I can help you with customer insights, process recommendations, and data analysis.
                  </p>
                </div>
              ) : (
                messages.map((message: any) => (
                  <div
                    key={message.id}
                    className={`flex space-x-2 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="text-accent" size={12} />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-neutral-100 text-neutral-800"
                      }`}
                    >
                      {message.content}
                    </div>

                    {message.role === "user" && (
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="text-primary" size={12} />
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {sendMessageMutation.isPending && (
                <div className="flex space-x-2 justify-start">
                  <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="text-accent" size={12} />
                  </div>
                  <div className="bg-neutral-100 text-neutral-800 px-3 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-neutral-200 flex-shrink-0">
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask me anything..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={sendMessageMutation.isPending}
                  className="text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending || !messageInput.trim()}
                  size="sm"
                >
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
