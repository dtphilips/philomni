import { useState, useEffect, useRef } from 'react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

/**
 * Reusable emoji picker button.
 *
 * Props:
 *   onEmojiSelect(emoji: string) — called with the native emoji character
 *   className                   — extra classes on the wrapper div
 *   pickerSide                  — 'right' (default) | 'left'  — horizontal alignment of the popup
 */
export default function EmojiPickerButton({ onEmojiSelect, className = '', pickerSide = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const alignClass = pickerSide === 'left' ? 'left-0' : 'right-0'

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-muted-foreground hover:text-foreground transition-colors p-1 leading-none"
        title="Emoji"
      >
        😊
      </button>
      {open && (
        <div className={`absolute bottom-full ${alignClass} mb-2 z-50`}>
          <Picker
            data={data}
            onEmojiSelect={(emoji) => {
              onEmojiSelect(emoji.native)
              setOpen(false)
            }}
            theme="dark"
            previewPosition="none"
            skinTonePosition="none"
          />
        </div>
      )}
    </div>
  )
}

/**
 * Insert `emoji` at the cursor position of a controlled textarea / input.
 *
 * @param {string}   text       current value
 * @param {Function} setValue   React state setter
 * @param {object}   inputRef   ref pointing at the DOM input/textarea
 * @param {string}   emoji      emoji character to insert
 */
export function insertAtCursor(text, setValue, inputRef, emoji) {
  const input = inputRef.current
  if (!input) {
    setValue(prev => prev + emoji)
    return
  }
  const start = input.selectionStart ?? text.length
  const end   = input.selectionEnd   ?? text.length
  const newValue = text.slice(0, start) + emoji + text.slice(end)
  setValue(newValue)
  setTimeout(() => {
    input.setSelectionRange(start + emoji.length, start + emoji.length)
    input.focus()
  }, 0)
}
