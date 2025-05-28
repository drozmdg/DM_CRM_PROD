import React, { useState } from 'react';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import ChatSessions from './ChatSessions';
import ChatDataProvider from './ChatDataProvider';
import ChatConfig from './ChatConfig';
import { PixelCard, PixelSubHeader, PixelButton } from '@/legacy/components/pixel';
import { ModernCard } from '@/components/ui/modern';
import { useFeatureFlags } from '@/config/featureFlags';
import { Bot, Settings, Code, X } from 'lucide-react';
import { generateSystemPrompt } from '@/lib/ai-chat/context';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Chat: React.FC = () => {
  const [flags] = useFeatureFlags();
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");

  const handleViewSystemPrompt = () => {
    setSystemPrompt(generateSystemPrompt());
    setShowSystemPrompt(true);
  };

  return (
    <ChatDataProvider>
      <div className="flex gap-4 h-[600px]">
        {/* Left Panel - Sessions and Config */}
        {flags.useModernComponents ? (
          <ModernCard className="w-[250px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Settings size={16} className="mr-2 text-teal-600" />
                <h3 className="text-lg font-semibold text-gray-900">Chat Settings</h3>
              </div>
            </div>

            <div className="mb-4">
              <ChatConfig />
            </div>

            <div className="mb-4">
              <button
                onClick={handleViewSystemPrompt}
                className="w-full flex items-center justify-between px-4 py-2 text-sm bg-teal-600 text-white hover:bg-teal-700 rounded-md cursor-pointer transition-colors"
              >
                <span>View System Prompt</span>
                <Code size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <ChatSessions />
            </div>
          </ModernCard>
        ) : (
          <PixelCard className="w-[250px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Settings size={16} className="mr-2 text-primary" />
                <h3 className="text-lg font-bold text-white">Chat Settings</h3>
              </div>
            </div>

            <div className="mb-4">
              <ChatConfig />
            </div>

            <div className="mb-4">
              <button
                onClick={handleViewSystemPrompt}
                className="w-full flex items-center justify-between px-4 py-2 text-sm bg-muted border-2 border-primary text-foreground hover:bg-muted/80 rounded cursor-pointer"
              >
                <span>View System Prompt</span>
                <Code size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <ChatSessions />
            </div>
          </PixelCard>
        )}

        {/* Main Chat Area */}
        {flags.useModernComponents ? (
          <ModernCard className="flex-1 flex flex-col">
            <div className="flex items-center mb-4">
              <Bot size={16} className="mr-2 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <ChatHistory />
              <ChatInput />
            </div>
          </ModernCard>
        ) : (
          <PixelCard className="flex-1 flex flex-col">
            <div className="flex items-center mb-4">
              <Bot size={16} className="mr-2 text-primary" />
              <h3 className="text-lg font-bold text-white">AI Assistant</h3>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <ChatHistory />
              <ChatInput />
            </div>
          </PixelCard>
        )}
      </div>

      {/* System Prompt Dialog */}
      <Dialog open={showSystemPrompt} onOpenChange={setShowSystemPrompt}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card border-2 border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between">
              <span>System Prompt</span>
              <button
                onClick={() => setShowSystemPrompt(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </DialogTitle>
          </DialogHeader>
          <div className="bg-black/30 p-4 rounded overflow-x-auto">
            <pre className="text-sm whitespace-pre-wrap">{systemPrompt}</pre>
          </div>
        </DialogContent>
      </Dialog>
    </ChatDataProvider>
  );
};

export default Chat;
