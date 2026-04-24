import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { postAuthorId, commenterName, commenterAvatar, commenterId, postId, commentPreview } = await req.json();

    if (!postAuthorId || !commenterId || !postId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Don't notify if user comments on their own post
    if (postAuthorId === commenterId) {
      return Response.json({ success: true });
    }

    await base44.asServiceRole.entities.Notification.create({
      user_id: postAuthorId,
      type: 'comment',
      title: `${commenterName} commented on your post`,
      body: commentPreview || 'Someone commented on your post',
      from_user_id: commenterId,
      from_user_name: commenterName,
      from_user_avatar: commenterAvatar,
      link: `/?post=${postId}`,
      read: false,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});