import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BadgeCheck, MessageSquare, UserPlus } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/categories';
import { getCollabMatchLabel } from '@/lib/collaboratorMatch';
import FollowButton from '@/components/profile/FollowButton';
import { useStartConversation } from '@/hooks/useStartConversation';

export default function CollaboratorCard({ candidate, score, reasons, currentUser }) {
  const matchInfo = getCollabMatchLabel(score);
  const startConversation = useStartConversation(currentUser);

  return (
    <div className="p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link to={`/user/${candidate.id}`} className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
            {candidate.avatar_url ? (
              <img src={candidate.avatar_url} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-semibold text-muted-foreground text-lg">
                {candidate.full_name?.[0]}
              </div>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link to={`/user/${candidate.id}`} className="font-semibold text-sm hover:underline truncate">
              {candidate.full_name}
            </Link>
            {candidate.verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
            {matchInfo && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${matchInfo.bg} ${matchInfo.color}`}>
                {matchInfo.label}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{candidate.headline}</p>

          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="secondary" className="text-xs capitalize">{ROLE_LABELS[candidate.role] || candidate.role}</Badge>
            {candidate.primary_category && (
              <Badge variant="outline" className="text-xs">{candidate.primary_category}</Badge>
            )}
            {candidate.availability === 'available' && (
              <Badge className="text-xs bg-green-500/10 text-green-600 border-0">Available</Badge>
            )}
          </div>

          {/* Match reasons */}
          {reasons.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {reasons.map((r, i) => (
                <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-primary/50 flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Score ring */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full border-2 border-primary/30 flex items-center justify-center bg-primary/5">
            <span className="text-xs font-bold text-primary">{score}%</span>
          </div>
          <span className="text-[10px] text-muted-foreground">match</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <FollowButton currentUser={currentUser} targetUserId={candidate.id} />
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => startConversation(candidate)}>
          <MessageSquare className="w-3.5 h-3.5" /> Message
        </Button>
      </div>
    </div>
  );
}