import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BadgeCheck, Music, MapPin, Users, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Creators() {
  const { user } = useOutletContext();
  const [search, setSearch] = useState('');

  const { data: creators = [], isLoading } = useQuery({
    queryKey: ['creators'],
    queryFn: async () => { const { data } = await supabase.from('users').select('*').eq('role', 'creator').order('follower_count', { ascending: false }).limit(50); return data ?? []; },
  });

  const filtered = creators.filter(c =>
    !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.headline?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Creator Discovery</h1>
        <p className="text-sm text-muted-foreground mt-1">Find and connect with talented creators worldwide</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search creators by name, genre, skill..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11 bg-muted/50" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Music className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No creators found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(creator => (
            <Link
              key={creator.id}
              to={`/user/${creator.id}`}
              className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all"
            >
              <div className="h-24 bg-gradient-to-br from-primary/20 to-accent relative">
                {creator.cover_url && <img src={creator.cover_url} className="w-full h-full object-cover" alt="" />}
              </div>
              <div className="p-4 -mt-8 relative">
                <div className="w-16 h-16 rounded-full bg-card border-4 border-card overflow-hidden mb-2">
                  {creator.avatar_url ? (
                    <img src={creator.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-lg font-medium text-muted-foreground">
                      {creator.full_name?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{creator.full_name}</h3>
                  {creator.verified && <BadgeCheck className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{creator.headline}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {creator.genre_tags?.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                  {creator.open_to_collabs && <Badge className="text-xs bg-primary/10 text-primary border-0">Open to Collabs</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {creator.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{creator.location}</span>}
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{creator.follower_count || 0} followers</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}