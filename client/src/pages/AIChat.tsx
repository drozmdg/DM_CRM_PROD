import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Send, User, Plus, MessageSquare, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AIChat() {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sessions } = useQuery({
    queryKey: ["/api/chat/sessions"],
  });

  const { data: messages } = useQuery({
    queryKey: ["/api/chat/sessions", selectedSessionId, "messages"],
    enabled: !!selectedSessionId,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: { title?: string; model?: string; systemPrompt?: string }) => {
      const response = await apiRequest("POST", "/api/chat/sessions", data);
      return response.json();
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions"] });
      setSelectedSessionId(session.id);
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
      const response = await apiRequest("POST", `/api/chat/sessions/${selectedSessionId}/messages`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/chat/sessions", selectedSessionId, "messages"] 
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
    if (!messageInput.trim() || !selectedSessionId) return;

    // Send user message
    await sendMessageMutation.mutateAsync({
      role: "user",
      content: messageInput,
    });

    // Simulate AI response (in a real app, this would be handled by the backend)
    setTimeout(async () => {
      await sendMessageMutation.mutateAsync({
        role: "assistant",
        content: "I'm an AI assistant integrated with your CRM data. I can help you analyze customer information, process data, and provide insights. How can I assist you today?",
      });
    }, 1000);
  };

  const handleCreateSession = () => {
    createSessionMutation.mutate({
      title: "New Chat Session",
      model: "llama2",
      systemPrompt: "You are an AI assistant integrated with a CRM system. Help users with customer insights, process management, and data analysis.",
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-800">Chat Sessions</h3>
                <Button
                  size="sm"
                  onClick={handleCreateSession}
                  disabled={createSessionMutation.isPending}
                >
                  <Plus size={16} />
                </Button>
              </div>

              <div className="space-y-2">
                {sessions?.map((session: any) => (
                  <Button
                    key={session.id}
                    variant={selectedSessionId === session.id ? "default" : "ghost"}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => setSelectedSessionId(session.id)}
                  >
                    <MessageSquare className="mr-2" size={16} />
                    <div className="flex-1 text-left">
                      <div className="font-medium truncate">
                        {session.title || "Chat Session"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>

              {(!sessions || sessions.length === 0) && (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-sm text-neutral-600 mb-4">
                    No chat sessions yet. Create one to get started!
                  </p>
                  <Button
                    onClick={handleCreateSession}
                    disabled={createSessionMutation.isPending}
                    className="w-full"
                  >
                    <Plus className="mr-2" size={16} />
                    New Chat
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            {selectedSessionId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-neutral-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                        <Bot className="text-accent" size={16} />
                      </div>
                      <h3 className="font-medium text-neutral-800">AI Assistant</h3>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Settings size={16} />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages?.map((message: any) => (
                    <div
                      key={message.id}
                      className={`flex space-x-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="text-accent" size={16} />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-neutral-100 text-neutral-800"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>

                      {message.role === "user" && (
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="text-primary" size={16} />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {sendMessageMutation.isPending && (
                    <div className="flex space-x-3 justify-start">
                      <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="text-accent" size={16} />
                      </div>
                      <div className="bg-neutral-100 text-neutral-800 px-4 py-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-neutral-200">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Ask me anything about your CRM data..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sendMessageMutation.isPending || !messageInput.trim()}
                    >
                      <Send size={16} />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Bot className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-800 mb-2">
                    AI Assistant Ready
                  </h3>
                  <p className="text-neutral-600 mb-4">
                    Select a chat session or create a new one to start getting AI-powered insights about your CRM data.
                  </p>
                  <Button
                    onClick={handleCreateSession}
                    disabled={createSessionMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="mr-2" size={16} />
                    Start New Chat
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
