import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Plus, MessageSquare, Settings, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIConfig } from "@/components/AIConfig";
import { SystemPromptViewer } from "@/components/SystemPromptViewer";
import { useChat } from "@/contexts/ChatContext";
import { ChatMessage } from "@/lib/ai-chat/types";

export default function AIChat() {
  const [messageInput, setMessageInput] = useState("");
  const [configOpen, setConfigOpen] = useState(false);
  const [promptViewerOpen, setPromptViewerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
    const {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    createSession,
    setCurrentSession,
    deleteSession,
    sendMessage
  } = useChat();

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isLoading) return;

    const messageContent = messageInput;
    setMessageInput("");

    try {
      await sendMessage(messageContent);
      toast({
        title: "Message sent",
        description: "Your message has been processed by the AI assistant.",
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCreateSession = () => {
    createSession();
    toast({
      title: "New session created",
      description: "A new chat session has been started.",
    });
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSession(sessionId);
    toast({
      title: "Session deleted",
      description: "The chat session has been removed.",
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
                  variant="outline"
                  onClick={handleCreateSession}
                >
                  <Plus size={16} />
                </Button>
              </div>              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-sm text-neutral-600">No chat sessions</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={handleCreateSession}
                    >
                      Create first session
                    </Button>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`relative group ${
                        session.id === currentSessionId 
                          ? "bg-primary/10 border-primary/20" 
                          : "hover:bg-neutral-50"
                      } rounded-lg border p-3 cursor-pointer transition-colors`}
                      onClick={() => setCurrentSession(session.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <MessageSquare className="flex-shrink-0" size={16} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm">
                              {session.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(session.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {sessions.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            onClick={(e) => handleDeleteSession(session.id, e)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* System Prompt Viewer Button */}
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setPromptViewerOpen(true)}
                >
                  <Eye className="mr-2" size={16} />
                  View System Prompt
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <Bot className="text-accent" size={16} />
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-800">AI Assistant</h3>
                    {currentSession && (
                      <p className="text-xs text-muted-foreground">{currentSession.title}</p>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setConfigOpen(true)}>
                  <Settings size={16} />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!currentSession ? (
                <div className="text-center py-12">
                  <Bot className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600 mb-4">
                    Create a chat session to start talking with the AI assistant.
                  </p>
                  <Button onClick={handleCreateSession}>
                    <Plus className="mr-2" size={16} />
                    Create Session
                  </Button>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">
                    👋 Hello! I'm your CRM AI Assistant. I can help you analyze customer data, optimize processes, manage teams, and improve service delivery. What would you like to explore today?
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex space-x-3 ${
                      message.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.sender === "ai" && (
                      <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="text-accent" size={16} />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-neutral-100 text-neutral-800"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>

                    {message.sender === "user" && (
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="text-primary" size={16} />
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex space-x-3 justify-start">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="text-accent" size={16} />
                  </div>
                  <div className="bg-neutral-100 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
                  placeholder={currentSession ? "Ask me anything about your CRM data..." : "Create a session to start chatting..."}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={!currentSession || isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || !currentSession || isLoading}
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>      {/* AI Configuration Dialog */}
      <AIConfig open={configOpen} onOpenChange={setConfigOpen} />
      
      {/* System Prompt Viewer Dialog */}
      <SystemPromptViewer open={promptViewerOpen} onOpenChange={setPromptViewerOpen} />
    </div>
  );
}