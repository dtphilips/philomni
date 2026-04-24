import React from 'react';
import { format } from 'date-fns';

export default function CollaborativeComments({ comments = [] }) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No comments yet. Start the discussion!</p>
    );
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {comments.map(comment => (
        <div key={comment.id} className="p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {comment.author_avatar ? (
                <img
                  src={comment.author_avatar}
                  alt={comment.author_name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold">
                  {comment.author_name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium">{comment.author_name}</span>
            </div>
            {comment.created_date && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(comment.created_date), 'MMM d, HH:mm')}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}