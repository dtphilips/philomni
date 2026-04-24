import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function MentionAutocomplete({ value, onChange, onMentionSelect, triggerRef }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(null);
  const suggestionsRef = useRef(null);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.asServiceRole.entities.User.list('', 100),
  });

  const filteredUsers = mentionQuery.length > 0
    ? allUsers.filter(u =>
        u.full_name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(mentionQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleInputChange = (e) => {
    const text = e.target.value;
    onChange(text);

    // Check for @ mention
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const afterAt = text.substring(lastAtIndex + 1);
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setMentionQuery(afterAt);
        setCursorPosition(lastAtIndex);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleSelectMention = (user) => {
    const lastAtIndex = value.lastIndexOf('@');
    const beforeMention = value.substring(0, lastAtIndex);
    const afterMention = value.substring(lastAtIndex + mentionQuery.length + 1);
    const newText = `${beforeMention}@${user.full_name} ${afterMention}`;
    onChange(newText);
    onMentionSelect(user);
    setIsOpen(false);
    setMentionQuery('');
  };

  if (!isOpen || mentionQuery.length === 0) return null;

  return (
    <div
      ref={suggestionsRef}
      className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
    >
      {filteredUsers.length === 0 ? (
        <div className="p-2 text-xs text-muted-foreground text-center">
          No users found
        </div>
      ) : (
        <div className="max-h-40 overflow-y-auto">
          {filteredUsers.map(user => (
            <button
              key={user.id}
              onClick={() => handleSelectMention(user)}
              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2 text-xs"
            >
              <div className="w-6 h-6 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-xs">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.full_name?.[0]
                )}
              </div>
              <span className="font-medium">{user.full_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}