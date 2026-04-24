import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { postAuthorId, likerName, likerAvatar, likerId, postId } = await req.json();

    if (!postAuthorId || !likerId || !postId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Don't notify if user likes their own post
    if (postAuthorId === likerId) {
      return Response.json({ success: true });
    }

    await base44.asServiceRole.entities.Notification.create({
      user_id: postAuthorId,
      type: 'like',
      title: `${likerName} liked your post`,
      body: 'Your post is getting engagement',
      from_user_id: likerId,
      from_user_name: likerName,
      from_user_avatar: likerAvatar,
      link: `/?post=${postId}`,
      read: false,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});