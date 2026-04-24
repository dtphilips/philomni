import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { conversationId, userId } = await req.json();

    if (!conversationId || !userId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get unread message count for this conversation
    const messages = await base44.asServiceRole.entities.Message.filter({
      conversation_id: conversationId,
      read: false,
    });

    // Filter messages not sent by the user
    const unreadCount = messages.filter(m => m.sender_id !== userId).length;

    // Update conversation unread count
    await base44.asServiceRole.entities.Conversation.update(conversationId, {
      unread_count: unreadCount,
    });

    return Response.json({ unreadCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});