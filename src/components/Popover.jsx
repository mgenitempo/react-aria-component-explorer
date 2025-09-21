import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react'
import { ICONS } from '../icons'

const Popover = forwardRef(function Popover({
  mainToSub, subToMains, selectedMain, setSelectedMain,
  onShowSubDetail, docHrefForSub
}, ref){
  const dialogRef = useRef()
  const [currentMain, setCurrentMain] = useState(null)
  const [drillSub, setDrillSub] = useState(null) // which subcomponent is being drilled into

  useImperativeHandle(ref, ()=> ({
    open: (mainName) => {
      setCurrentMain(mainName)
      setSelectedMain(mainName)
      setDrillSub(null)
      try{ dialogRef.current?.showModal() } catch(e){ dialogRef.current?.setAttribute('open','') }
    },
    close: () => {
      dialogRef.current?.close?.()
      dialogRef.current?.removeAttribute('open')
    }
  }), [setSelectedMain])

  function close(){
    dialogRef.current?.close?.()
    dialogRef.current?.removeAttribute('open')
  }

  useEffect(()=>{
    function onCancel(e){ e.preventDefault(); close() }
    const d = dialogRef.current
    if (!d) return
    d.addEventListener('cancel', onCancel)
    return ()=> d.removeEventListener('cancel', onCancel)
  }, [])

  const subs = (mainToSub[currentMain] || [])
  const usedBy = drillSub ? (subToMains[drillSub] || []) : []

  function handleDrill(sub){
    setDrillSub(sub)
    onShowSubDetail?.(sub) // also update right panel
  }

  function handleOpenMain(nextMain){
    setCurrentMain(nextMain)
    setSelectedMain(nextMain)
    setDrillSub(null) // reset drill when navigating to a main
  }

  return (
    <dialog id="popover" className="popover" aria-modal="true" aria-labelledby="popTitle" ref={dialogRef}
      onClick={(e)=>{ if(e.target===dialogRef.current) close() }}
      onKeyDown={(e)=>{ if(e.key==='Escape') close() }}>
      <div className="card" role="document">
        <header>
          <h2 id="popTitle" style={{margin:0, fontSize:'1.1rem'}}>{currentMain}</h2>
          <button aria-label="Close popover" className="circle-btn" style={{padding:'8px 8px', minHeight:40, minWidth:40}} onClick={close}>X</button>
        </header>

        <div className="chips" id="subChips" aria-live="polite">
          {subs.map(s => {
            const href = docHrefForSub(s, currentMain)
            return (
              <span key={s} className="chip">
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {s}
                  <span className="ext-icon" title="opens in a new tab" aria-label="opens in a new tab" dangerouslySetInnerHTML={{__html: ICONS.ext}}/>
                </a>
                <button
                  type="button"
                  className="circle-btn"
                  title="Show all main components that use this subcomponent"
                  aria-label={`Show all main components that use ${s}`}
                  onClick={()=> handleDrill(s)}
                  dangerouslySetInnerHTML={{__html: ICONS.grid}}
                />
              </span>
            )
          })}
        </div>

        {drillSub && (
          <div className="detail" id="detailPanel">
            <h3 id="detailTitle">“{drillSub}” is used by:</h3>
            <div className="mains-list" id="mainsList">
              {usedBy.map(m => (
                <button key={m} className="tag-btn" title="Open component" aria-label={`Open ${m}`} onClick={()=> handleOpenMain(m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="footer small">
          Links go to the closest matching page under <code>/react-aria</code>.
        </div>
      </div>
    </dialog>
  )
})

export default Popover
