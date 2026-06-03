import React, { useEffect, useState } from 'react'

// ─── Always-on diagnostic overlay (TEMP) ──────────────────────────────────────
// Records auth events, page mounts, fetch start/end, and browser lifecycle
// (freeze/resume/bfcache/visibility) with timestamps so we can see EXACTLY what
// happens when the tab is left and returned to. Call window.__dlog(msg) anywhere.
// Remove this component + its mount in App.jsx once the tab-return bug is fixed.

const _buf = []
function push(msg) {
  const t = new Date()
  const stamp = `${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}.${String(t.getMilliseconds()).padStart(3, '0')}`
  _buf.push(`${stamp}  ${msg}`)
  if (_buf.length > 40) _buf.shift()
  if (typeof window !== 'undefined' && window.__dhudUpdate) window.__dhudUpdate([..._buf])
}
// Expose globally so AuthContext / Feed / anywhere can log
if (typeof window !== 'undefined') window.__dlog = push

export default function DebugHUD() {
  const [lines, setLines] = useState([..._buf])
  const [open, setOpen] = useState(true)

  useEffect(() => {
    window.__dhudUpdate = setLines

    const log = (m) => push(m)
    const onVis   = () => log(`VIS → ${document.visibilityState}`)
    const onFreeze = () => log('FREEZE (tab suspended by browser)')
    const onResume = () => log('RESUME (tab un-suspended)')
    const onPageHide = (e) => log(`pagehide persisted=${e.persisted}`)
    const onPageShow = (e) => log(`pageshow persisted=${e.persisted}` + (e.persisted ? ' (FROM BFCACHE)' : ''))
    const onOnline  = () => log('NETWORK online')
    const onOffline = () => log('NETWORK offline')

    document.addEventListener('visibilitychange', onVis)
    document.addEventListener('freeze', onFreeze)
    document.addEventListener('resume', onResume)
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    log('HUD mounted (page (re)loaded)')

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      document.removeEventListener('freeze', onFreeze)
      document.removeEventListener('resume', onResume)
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ position: 'fixed', bottom: 8, left: 8, zIndex: 99999, fontSize: 11,
          background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px' }}
      >debug</button>
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: 8, left: 8, zIndex: 99999,
      width: 340, maxHeight: 260, overflowY: 'auto',
      background: 'rgba(0,0,0,0.88)', color: '#0f0', border: '1px solid #444',
      borderRadius: 8, padding: 8, fontFamily: 'monospace', fontSize: 10, lineHeight: 1.4,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <strong style={{ color: '#a78bfa' }}>DEBUG — screenshot when stuck</strong>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>×</button>
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{
          color: l.includes('ERROR') || l.includes('FREEZE') || l.includes('SIGNED_OUT') ? '#f87171'
               : l.includes('END') || l.includes('RESUME') || l.includes('SIGNED_IN') ? '#34d399'
               : l.includes('START') || l.includes('MOUNT') ? '#fbbf24' : '#9ca3af',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>{l}</div>
      ))}
    </div>
  )
}
