import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, MapPin, Users, BadgeCheck, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Directory() {
  const { user } = useOutletContext();
  const [search, setSearch] = useState('');

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.User.filter({ role: 'business' }, '-created_date', 50),
  });

  const filtered = businesses.filter(b =>
    !search || b.company_name?.toLowerCase().includes(search.toLowerCase()) || b.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Business Directory</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover verified businesses and organizations</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search businesses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11 bg-muted/50" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No businesses found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(biz => (
            <Link
              key={biz.id}
              to={`/user/${biz.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                {biz.avatar_url ? (
                  <img src={biz.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <Building2 className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm">{biz.company_name || biz.full_name}</h3>
                  {biz.verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground">{biz.headline}</p>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  {biz.industry && <span>{biz.industry}</span>}
                  {biz.company_size && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{biz.company_size} employees</span>}
                  {biz.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{biz.location}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}