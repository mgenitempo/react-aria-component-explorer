import React from 'react'

export default function ComponentGrid({ mains, mainToSub, customs, selectedMain, onOpen }){
  return (
    <div id="compGrid" className="grid">
      {mains.map(m => {
        const isCustom = customs.has(m)
        const pressed = selectedMain === m
        return (
          <button type="button"
            key={m}
            className={'comp-btn' + (isCustom ? ' custom' : '')}
            aria-pressed={pressed}
            style={{ boxShadow: pressed ? 'inset 0 0 0 3px var(--accent)' : 'none' }}
            onClick={()=>onOpen(m)}
            onKeyDown={(e)=>{ if(e.key==='Enter') onOpen(m) }}
          >
            <strong>{m}</strong><br/>
            <span className="small">{(mainToSub[m]||[]).length} subcomponents</span>
          </button>
        )
      })}
    </div>
  )
}
