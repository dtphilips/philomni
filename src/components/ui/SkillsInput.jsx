import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { SKILL_SUGGESTIONS } from '@/lib/categories';

/**
 * Tag-based skill picker.
 * Props:
 *   skills: string[]   — current list
 *   onChange: (skills: string[]) => void
 *   max?: number       — maximum tags (default 15)
 *   placeholder?: string
 */
export default function SkillsInput({ skills = [], onChange, max = 15, placeholder = 'Add a skill...' }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const suggestions = query.trim().length > 0 ? SKILL_SUGGESTIONS(query) : [];

  const add = (skill) => {
    const trimmed = skill.trim();
    if (!trimmed || skills.includes(trimmed) || skills.length >= max) return;
    onChange([...skills, trimmed]);
    setQuery('');
    inputRef.current?.focus();
  };

  const remove = (skill) => onChange(skills.filter(s => s !== skill));

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && query.trim()) {
      e.preventDefault();
      add(query);
    }
    if (e.key === 'Backspace' && !query && skills.length > 0) {
      remove(skills[skills.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[2.5rem] p-2 rounded-md border border-input bg-transparent focus-within:ring-1 focus-within:ring-ring">
        {skills.map(skill => (
          <Badge key={skill} variant="secondary" className="flex items-center gap-1 pr-1 text-xs">
            {skill}
            <button type="button" onClick={() => remove(skill)} className="ml-0.5 hover:text-destructive transition-colors">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        {skills.length < max && (
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={skills.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.filter(s => !skills.includes(s)).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="text-xs px-2.5 py-1 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Type to search, press Enter or comma to add. {skills.length}/{max} skills</p>
    </div>
  );
}