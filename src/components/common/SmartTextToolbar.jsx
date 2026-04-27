/**
 * SmartTextToolbar — Notion-style floating AI rewrite toolbar.
 * Mounts once at root level. Appears whenever the user selects text
 * inside a contentEditable or textarea element.
 *
 * Usage: render <SmartTextToolbar /> once inside AppLayout.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const OPTIONS = [
  { id: 'shorten',     label: '✂ Shorten',     prompt: (t) => `Shorten this to about half the length while keeping the core meaning:\n\n"${t}"\n\nReturn only the shortened text, no quotes, no explanation.` },
  { id: 'elaborate',   label: '📝 Elaborate',   prompt: (t) => `Expand this with more detail, context, and depth:\n\n"${t}"\n\nReturn only the expanded text, no quotes.` },
  { id: 'professional',label: '💼 Professional',prompt: (t) => `Rewrite in a clear, professional, business-appropriate tone:\n\n"${t}"\n\nReturn only the rewritten text.` },
  { id: 'casual',      label: '😊 Casual',      prompt: (t) => `Rewrite in a friendly, casual, conversational tone:\n\n"${t}"\n\nReturn only the rewritten text.` },
  { id: 'emojify',     label: '🎉 Emojify',     prompt: (t) => `Add relevant emojis throughout to make it more lively and engaging:\n\n"${t}"\n\nReturn only the text with emojis added.` },
  { id: 'grammar',     label: '✅ Fix Grammar', prompt: (t) => `Fix all grammar, spelling, and punctuation errors:\n\n"${t}"\n\nReturn only the corrected text.` },
  { id: 'translate',   label: '🌐 Translate ES', prompt: (t) => `Translate this text to Spanish:\n\n"${t}"\n\nReturn only the Spanish translation.` },
];

export default function SmartTextToolbar() {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const savedRangeRef = useRef(null);
  const savedTextareaRef = useRef(null);
  const savedSelectionRef = useRef({ start: 0, end: 0 });
  const toolbarRef = useRef(null);
  const hideTimerRef = useRef(null);

  const isEditableTarget = (el) => {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    if (tag === 'textarea' || (tag === 'input' && el.type !== 'checkbox' && el.type !== 'radio')) return true;
    let node = el;
    while (node) {
      if (node.contentEditable === 'true') return true;
      node = node.parentElement;
    }
    return false;
  };

  const handleSelectionChange = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    const sel = window.getSelection();
    const text = sel?.toString().trim();

    // Check if inside a textarea (getSelection doesn't cover textarea)
    const active = document.activeElement;
    if (active?.tagName?.toLowerCase() === 'textarea' || active?.tagName?.toLowerCase() === 'input') {
      const { selectionStart: start, selectionEnd: end } = active;
      const selected = active.value?.slice(start, end)?.trim();
      if (selected && selected.length > 3) {
        // Position near input
        const rect = active.getBoundingClientRect();
        setPos({ x: rect.left + rect.width / 2, y: rect.top });
        savedTextareaRef.current = active;
        savedSelectionRef.current = { start, end };
        savedRangeRef.current = null;
        setVisible(true);
        return;
      }
    }

    if (!text || text.length < 4) {
      hideTimerRef.current = setTimeout(() => setVisible(false), 200);
      return;
    }

    const isEditable = isEditableTarget(sel?.anchorNode?.parentElement);
    if (!isEditable) { setVisible(false); return; }

    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) { setVisible(false); return; }
      setPos({ x: rect.left + rect.width / 2, y: rect.top });
      savedRangeRef.current = range.cloneRange();
      savedTextareaRef.current = null;
      setVisible(true);
    } catch {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      clearTimeout(hideTimerRef.current);
    };
  }, [handleSelectionChange]);

  const handleRewrite = async (option) => {
    // Get the selected text before losing focus
    let selectedText = '';
    if (savedTextareaRef.current) {
      const { start, end } = savedSelectionRef.current;
      selectedText = savedTextareaRef.current.value.slice(start, end).trim();
    } else if (savedRangeRef.current) {
      selectedText = savedRangeRef.current.toString().trim();
    }
    if (!selectedText) { toast.error('No text selected'); return; }

    setLoading(true);
    setActiveId(option.id);
    try {
      const res = await (async () => { const _llmRes = await fetch('/api/llm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: option.prompt(selectedText) }) }); const _llmData = await _llmRes.json(); return { result: _llmData.result ?? '' }; })();
      const newText = typeof res === 'string' ? res : (res?.result ?? res?.text ?? '');
      if (!newText) { toast.error('No result returned'); return; }

      // Replace in textarea
      if (savedTextareaRef.current) {
        const el = savedTextareaRef.current;
        const { start, end } = savedSelectionRef.current;
        const before = el.value.slice(0, start);
        const after = el.value.slice(end);
        const newValue = before + newText + after;
        // Use native setter to trigger React onChange
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
          || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(el, newValue);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          el.value = newValue;
        }
        el.setSelectionRange(start, start + newText.length);
        el.focus();
      } else if (savedRangeRef.current) {
        // Replace in contentEditable
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
        document.execCommand('insertText', false, newText);
      }
      setVisible(false);
    } catch (err) {
      toast.error('Rewrite failed — check API connection');
    }
    setLoading(false);
    setActiveId(null);
  };

  if (!visible) return null;

  return createPortal(
    <div
      ref={toolbarRef}
      onMouseDown={e => e.preventDefault()} // keep selection alive
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y - 50}px`,
        transform: 'translateX(-50%)',
        zIndex: 99999,
      }}
      className="flex items-center gap-0.5 bg-popover border border-border rounded-xl shadow-xl px-1.5 py-1 animate-in fade-in slide-in-from-bottom-1 duration-150"
    >
      <Sparkles className="w-3.5 h-3.5 text-primary mx-1 flex-shrink-0" />
      <div className="w-px h-4 bg-border mx-0.5" />
      {OPTIONS.map(opt => (
        <button
          key={opt.id}
          onMouseDown={e => { e.preventDefault(); handleRewrite(opt); }}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg hover:bg-muted transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {loading && activeId === opt.id && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
          {opt.label}
        </button>
      ))}
    </div>,
    document.body
  );
}
