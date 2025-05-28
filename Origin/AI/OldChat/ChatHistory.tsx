import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import { useChat } from '@/context/ChatContext';

const ChatHistory: React.FC = () => {
  const { currentSession } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  if (!currentSession) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <p className="text-gray-400">No active chat session</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {currentSession.messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatHistory;
