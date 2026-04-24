import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
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