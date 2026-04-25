import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { MessageSquare, Lock } from 'lucide-react';
import ChatList from '@/components/messages/ChatList';
import ChatWindow from '@/components/messages/ChatWindow';
import StartConversationModal from '@/components/messages/StartConversationModal';

export default function Messages() {
  const { user } = useOutletContext();
  const [activeConvo, setActiveConvo] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);

  const handleStartConvo = (convo) => {
    setActiveConvo(convo);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Sign in to access Messages</h2>
          <p className="text-muted-foreground text-sm max-w-sm">Connect and message other creators, professionals, and businesses on Philomni.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#6d28d9,#9333ea)' }}>Sign in</Link>
          <Link to="/signup" className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted transition-colors">Create account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-background rounded-xl border border-border overflow-hidden"
      style={{ height: 'calc(100dvh - 8.5rem)' }}>
      {/* Chat list — full width on mobile when no active convo, fixed width on sm+ */}
      <div className={`${activeConvo ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 md:w-96 flex-col`}>
        <ChatList
          user={user}
          activeConvo={activeConvo}
          onSelectConvo={setActiveConvo}
          onStartNew={() => setShowStartModal(true)}
        />
      </div>

      {/* Chat window — full screen on mobile when active, flex-1 on sm+ */}
      {activeConvo ? (
        <div className="flex-1 flex flex-col min-w-0">
          <ChatWindow
            user={user}
            conversation={activeConvo}
            onBack={() => setActiveConvo(null)}
          />
        </div>
      ) : (
        <div className="hidden sm:flex flex-1 items-center justify-center text-muted-foreground">
          <p className="text-sm">Select a conversation to start messaging</p>
        </div>
      )}

      <StartConversationModal
        open={showStartModal}
        onOpenChange={setShowStartModal}
        user={user}
        onConversationStart={handleStartConvo}
      />
    </div>
  );
}