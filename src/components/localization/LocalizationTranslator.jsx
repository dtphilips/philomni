import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Globe } from 'lucide-react';
import { toast } from 'sonner';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' }
];

export default function LocalizationTranslator({ isOpen, onClose, content, contentType, onTranslationComplete }) {
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [translating, setTranslating] = useState(false);

  const toggleLanguage = (code) => {
    setSelectedLanguages(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const handleTranslate = async () => {
    if (selectedLanguages.length === 0) {
      toast.error('Select at least one language');
      return;
    }

    setTranslating(true);
    try {
      const user = user /* useAuth() */;
      const translations = [];

      for (const langCode of selectedLanguages) {
        const response = await (async () => { const _llmRes = await fetch('/api/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `Translate the following ${contentType }) }); const _llmData = await _llmRes.json(); return { result: _llmData.result ?? '' }; })();

        (await supabase.from('contentTranslations').insert({
          user_id: user.id,
          original_content_id: contentType, // You should pass the actual ID
          original_language: 'en',
          target_language: langCode,
          content_type: contentType,
          translated_content: response.translated_content,
          is_published: false
        }).select().single()).data;

        translations.push({
          language: langCode,
          content: response.translated_content
        });
      }

      toast.success(`Translated to ${selectedLanguages.length} languages!`);
      onTranslationComplete?.(translations);
      setSelectedLanguages([]);
      onClose();
    } catch (error) {
      toast.error('Translation failed: ' + error.message);
    }
    setTranslating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Translate Content
          </DialogTitle>
          <DialogDescription>Select languages to translate your content to</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                disabled={translating}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  selectedLanguages.includes(lang.code)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <p className="text-lg mb-1">{lang.flag}</p>
                <p className="text-sm font-medium">{lang.label}</p>
                <p className="text-xs text-muted-foreground">{lang.code}</p>
              </button>
            ))}
          </div>

          {selectedLanguages.length > 0 && (
            <div className="p-3 rounded-lg bg-accent/20">
              <p className="text-sm font-medium mb-2">Selected languages:</p>
              <div className="flex gap-2 flex-wrap">
                {selectedLanguages.map(code => {
                  const lang = LANGUAGES.find(l => l.code === code);
                  return (
                    <Badge key={code}>{lang?.flag} {lang?.label}</Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={translating}>
              Cancel
            </Button>
            <Button
              onClick={handleTranslate}
              disabled={translating || selectedLanguages.length === 0}
            >
              {translating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Translate to {selectedLanguages.length} {selectedLanguages.length === 1 ? 'Language' : 'Languages'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}