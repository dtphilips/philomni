import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

/**
 * Returns a function that finds or creates a 1-to-1 conversation between
 * currentUser and targetUser, then navigates to /messages?convoId=<id>
 */
export function useStartConversation(currentUser) {
  const navigate = useNavigate();

  return async (targetUser) => {
    // Look for an existing 1-to-1 conversation with this user
    const all = await base44.entities.Conversation.list('-last_message_at', 100);
    const existing = all.find(
      c =>
        !c.is_group &&
        c.participant_ids?.includes(currentUser.id) &&
        c.participant_ids?.includes(targetUser.id)
    );

    if (existing) {
      navigate(`/messages?convoId=${existing.id}`);
      return;
    }

    // Create a new conversation
    const created = await base44.entities.Conversation.create({
      participant_ids: [currentUser.id, targetUser.id],
      participant_names: [currentUser.full_name, targetUser.full_name],
      is_group: false,
      last_message: '',
    });

    navigate(`/messages?convoId=${created.id}`);
  };
}