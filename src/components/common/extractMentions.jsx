// Extract mentions from text and return array of user IDs
export function extractMentions(text) {
  const mentionPattern = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionPattern.exec(text)) !== null) {
    mentions.push(match[1]); // Store the mentioned username
  }
  
  return mentions;
}

// Extract mentions as full text with user info
export function extractMentionedUsers(text, allUsers) {
  const mentionPattern = /@([^\s@]+)/g;
  const mentionedUserIds = [];
  let match;

  while ((match = mentionPattern.exec(text)) !== null) {
    const username = match[1];
    const user = allUsers.find(u =>
      u.full_name?.toLowerCase().replace(/\s+/g, '') === username.toLowerCase()
    );
    if (user && !mentionedUserIds.includes(user.id)) {
      mentionedUserIds.push(user.id);
    }
  }

  return mentionedUserIds;
}