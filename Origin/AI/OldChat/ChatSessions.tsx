import React from 'react';
import { useChat } from '@/context/ChatContext';
import { PixelButton } from '@/legacy/components/pixel';
import { PlusCircle, Trash2, RefreshCw, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const ChatSessions: React.FC = () => {
  const {
    sessions,
    currentSession,
    createNewSession,
    switchSession,
    deleteSession,
    clearCurrentSession
  } = useChat();

  return (
    <div>
      <div className="flex items-center mb-4">
        <MessageSquare size={16} className="mr-2 text-primary" />
        <h3 className="text-lg font-bold text-white">Chat Sessions</h3>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <button
          onClick={createNewSession}
          className="w-full flex items-center justify-between px-4 py-2 text-sm bg-primary border-2 border-border text-primary-foreground hover:bg-primary/80 rounded"
        >
          <span>New Chat</span>
          <PlusCircle size={14} />
        </button>

        {currentSession && (
          <button
            onClick={clearCurrentSession}
            className="w-full flex items-center justify-between px-4 py-2 text-sm bg-muted border-2 border-primary text-foreground hover:bg-muted/80 rounded"
            disabled={!currentSession}
          >
            <span>Clear Current Chat</span>
            <RefreshCw size={14} />
          </button>
        )}
      </div>

      <div className="space-y-2 overflow-y-auto pr-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={cn(
              "flex items-center justify-between p-2 rounded cursor-pointer",
              session.id === currentSession?.id
                ? "bg-muted border-2 border-primary"
                : "bg-card border-2 border-border hover:bg-muted/50"
            )}
            onClick={() => switchSession(session.id)}
          >
            <div className="truncate flex-1">
              <p className="text-sm text-white font-medium">{session.title}</p>
              <p className="text-xs text-gray-400">
                {new Date(session.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this chat session?')) {
                  deleteSession(session.id);
                }
              }}
              className="text-gray-400 hover:text-red-500 p-1"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatSessions;
