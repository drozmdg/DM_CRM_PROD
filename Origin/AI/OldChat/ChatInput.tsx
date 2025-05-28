import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import PixelButton from '@/legacy/components/pixel/PixelButton';
import { ModernButton } from '@/components/ui/modern';
import { useFeatureFlags } from '@/config/featureFlags';
import { Send, Loader2, MessageSquarePlus } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import SuggestedQueries from './SuggestedQueries';

const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [flags] = useFeatureFlags();
  const { sendMessage, isProcessing } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isProcessing) {
      sendMessage(message);
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle selecting a suggested query
  const handleSelectQuery = (query: string) => {
    setMessage(query);
    setShowSuggestions(false);

    // Focus the textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t-2 border-border pt-4">
      <div className="max-w-3xl mx-auto">
        {showSuggestions && (
          <SuggestedQueries onSelectQuery={handleSelectQuery} />
        )}

        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="min-h-[60px] max-h-[200px] bg-background border-2 border-border text-foreground resize-none w-full"
              disabled={isProcessing}
            />
            <button
              type="button"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="absolute right-2 bottom-2 text-primary hover:text-primary/80 transition-colors"
              title="Show suggested queries"
            >
              <MessageSquarePlus size={16} />
            </button>
          </div>
          {flags.useModernComponents ? (
            <ModernButton
              type="submit"
              variant="primary"
              className="h-[60px] px-4"
              disabled={!message.trim() || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </ModernButton>
          ) : (
            <PixelButton
              type="submit"
              variant="primary"
              className="h-[60px] px-4"
              disabled={!message.trim() || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </PixelButton>
          )}
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
