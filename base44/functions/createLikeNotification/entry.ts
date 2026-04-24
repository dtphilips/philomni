import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const { event, data } = await req.json();

  if (event.type !== 'create') {
    return Response.json({ success: false });
  }

  const base44 = createClientFromRequest(req);

  // Get the post author details
  const post = await base44.asServiceRole.entities.Post.get(data.post_id);
  const liker = await base44.asServiceRole.entities.User.get(data.user_id);

  if (!post || post.author_id === data.user_id) {
    return Response.json({ success: true });
  }

  await base44.asServiceRole.entities.Notification.create({
    user_id: post.author_id,
    type: 'like',
    title: `${liker.full_name} liked your post`,
    body: `Your post received a like`,
    link: `/posts/${data.post_id}`,
    from_user_id: data.user_id,
    from_user_name: liker.full_name,
    from_user_avatar: liker.avatar_url || '',
    read: false
  });

  return Response.json({ success: true });
});