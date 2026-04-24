import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { followedUserId, followerName, followerAvatar, followerId } = await req.json();

    if (!followedUserId || !followerId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Notification.create({
      user_id: followedUserId,
      type: 'follow',
      title: `${followerName} started following you`,
      body: 'Check out their profile',
      from_user_id: followerId,
      from_user_name: followerName,
      from_user_avatar: followerAvatar,
      link: `/user/${followerId}`,
      read: false,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});