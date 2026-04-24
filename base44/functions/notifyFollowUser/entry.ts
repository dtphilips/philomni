import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const { event, data } = await req.json();

  if (event.type !== 'create') {
    return Response.json({ success: false });
  }

  const base44 = createClientFromRequest(req);

  // Get follower details
  const follower = await base44.asServiceRole.entities.User.get(data.follower_id);

  if (!follower || data.follower_id === data.followed_user_id) {
    return Response.json({ success: true });
  }

  await base44.asServiceRole.entities.Notification.create({
    user_id: data.followed_user_id,
    type: 'follow',
    title: `${follower.full_name} followed you`,
    body: `${follower.full_name} started following your content`,
    link: `/user/${data.follower_id}`,
    from_user_id: data.follower_id,
    from_user_name: follower.full_name,
    from_user_avatar: follower.avatar_url || '',
    read: false
  });

  return Response.json({ success: true });
});