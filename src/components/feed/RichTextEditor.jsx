import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, List, ListOrdered, Link2, Link as LinkIcon } from 'lucide-react';

export default function RichTextEditor({ value, onChange, placeholder, className }) {
  const editorRef = useRef(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleAddLink = () => {
    if (linkUrl.trim()) {
      applyFormat('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e) => {
    if (showLinkInput && e.key === 'Enter') {
      e.preventDefault();
      handleAddLink();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1 p-2 border border-border rounded-lg bg-muted/30 flex-wrap">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => applyFormat('bold')}
          className="h-8 w-8 p-0"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => applyFormat('italic')}
          className="h-8 w-8 p-0"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <div className="w-px bg-border" />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => applyFormat('insertUnorderedList')}
          className="h-8 w-8 p-0"
          title="Bullet list"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => applyFormat('insertOrderedList')}
          className="h-8 w-8 p-0"
          title="Numbered list"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <div className="w-px bg-border" />
        <div className="relative">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowLinkInput(!showLinkInput)}
            className="h-8 w-8 p-0"
            title="Add link"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          {showLinkInput && (
            <div className="absolute top-full mt-1 left-0 bg-card border border-border rounded-lg shadow-lg p-2 z-50 w-48">
              <input
                type="text"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
              <div className="flex gap-1 mt-2">
                <Button size="sm" onClick={handleAddLink} className="flex-1 h-7 text-xs">Add</Button>
                <Button size="sm" variant="outline" onClick={() => { setShowLinkInput(false); setLinkUrl(''); }} className="flex-1 h-7 text-xs">Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
        className={`w-full min-h-[100px] p-3 border border-border rounded-lg bg-transparent text-base focus:outline-none focus:ring-1 focus:ring-ring resize-none ${className}`}
        style={{
          WebkitUserModify: 'read-write-plaintext-only'
        }}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData('text/plain');
          document.execCommand('insertText', false, text);
        }}
      >
        {placeholder && !value && <span className="text-muted-foreground/60">{placeholder}</span>}
      </div>
    </div>
  );
}