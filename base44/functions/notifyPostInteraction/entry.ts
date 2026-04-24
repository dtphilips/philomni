import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { post_id, action_type, action_user_id, action_user_name, action_user_avatar } = await req.json();

    if (!post_id || !action_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the post to find its author
    const post = await base44.entities.Post.list();
    const targetPost = post.find(p => p.id === post_id);
    
    if (!targetPost || targetPost.author_id === action_user_id) {
      return Response.json({ success: false });
    }

    // Create notification
    const notificationTitle = {
      like: `${action_user_name} liked your post`,
      comment: `${action_user_name} commented on your post`,
      share: `${action_user_name} shared your post`
    }[action_type] || 'New activity on your post';

    const notificationBody = {
      like: `Your post received a like from ${action_user_name}`,
      comment: `${action_user_name} replied to your post`,
      share: `${action_user_name} shared your post with others`
    }[action_type] || 'Check out the activity on your post';

    await base44.asServiceRole.entities.Notification.create({
      user_id: targetPost.author_id,
      type: action_type === 'share' ? 'repost' : action_type,
      title: notificationTitle,
      body: notificationBody,
      link: `/posts/${post_id}`,
      from_user_id: action_user_id,
      from_user_name: action_user_name,
      from_user_avatar: action_user_avatar,
      read: false
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});