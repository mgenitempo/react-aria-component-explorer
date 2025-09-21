import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ICONS } from './icons'
import Chart from './components/Chart.jsx'
import ComponentGrid from './components/ComponentGrid.jsx'
import Popover from './components/Popover.jsx'

const BASE = 'https://react-spectrum.adobe.com/react-aria/'

function App(){
  const root = typeof document !== 'undefined' ? document.documentElement : null
  const [theme, setTheme] = useState('light')
  const [data, setData] = useState({ mainToSub: {}, subToMains: {} })
  const [customs, setCustoms] = useState(new Set())
  const [filter, setFilter] = useState('')
  const [selectedMain, setSelectedMain] = useState(null)
  const [detailSub, setDetailSub] = useState(null)
  const popRef = useRef()

  useEffect(()=>{
    const saved = localStorage.getItem('theme')
    let t = 'light'
    if (saved) t = saved
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) t = 'dark'
    setTheme(t)
    root?.setAttribute('data-theme', t)
  },[])

  useEffect(()=>{
    root?.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(()=>{
    async function load(){
      try{
        const [jRes, cRes] = await Promise.all([
          fetch('/data/components.json'),
          fetch('/data/custom-components.json')
        ])
        const j = await jRes.json()
        const c = new Set(await cRes.json())
        const mainToSub = j.mainToSub
        const subToMains = {}
        for (const [m, subs] of Object.entries(mainToSub)){
          subs.forEach(s => {
            if(!subToMains[s]) subToMains[s] = []
            if(!subToMains[s].includes(m)) subToMains[s].push(m)
          })
        }
        for (const k in subToMains) subToMains[k].sort((a,b)=>a.localeCompare(b))
        setData({ mainToSub, subToMains })
        setCustoms(c)
      }catch(err){
        console.warn('JSON load failed, trying XLSX', err)
        try{
          const res = await fetch('/ReactAriaComponentBreakdown.xlsx')
          const buf = await res.arrayBuffer()
          const XLSX = await import('xlsx')
          const wb = XLSX.read(buf, { type:'array' })
          const sh = wb.Sheets[wb.SheetNames[0]]
          const raw = XLSX.utils.sheet_to_json(sh, { header:1 })
          const headers = raw[0]
          const mainToSub2 = {}
          for (let ci=0; ci<headers.length; ci++){
            const main = headers[ci]
            if (!main) continue
            const subs = []
            for (let ri=1; ri<raw.length; ri++){
              const cell = raw[ri][ci]
              if (cell!=null && cell!==''){
                subs.push((''+cell).trim())
              }
            }
            mainToSub2[main] = Array.from(new Set(subs)).sort((a,b)=>a.localeCompare(b))
          }
          const subToMains2 = {}
          Object.entries(mainToSub2).forEach(([m, subs])=>{
            subs.forEach(s=>{
              if(!subToMains2[s]) subToMains2[s] = []
              if(!subToMains2[s].includes(m)) subToMains2[s].push(m)
            })
          })
          for (const k in subToMains2) subToMains2[k].sort((a,b)=>a.localeCompare(b))
          setData({ mainToSub: mainToSub2, subToMains: subToMains2 })
          setCustoms(new Set(['Description','Message','LabelledGroup']))
        }catch(e2){
          console.error('Failed to load XLSX fallback', e2)
        }
      }
    }
    load()
  },[])

  const mains = useMemo(()=> Object.keys(data.mainToSub).sort((a,b)=>a.localeCompare(b)), [data])
  const filteredMains = useMemo(()=> mains.filter(m => m.toLowerCase().includes(filter.toLowerCase())), [mains, filter])

  function toggleTheme(){
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    const el = document.getElementById('themeToggle')
    el?.classList.add('flipping')
    setTimeout(()=> el?.classList.remove('flipping'), 320)
  }

  function docHrefForSub(sub, contextMain){
    const hasOwnPage = Object.prototype.hasOwnProperty.call(data.mainToSub, sub)
    const parents = data.subToMains[sub] || []
    const parent = hasOwnPage ? sub : (parents.includes(contextMain) ? contextMain : (parents[0] || contextMain || sub))
    return BASE + parent + '.html'
  }

  function onOpenMain(mainName){
    console.log('onOpenMain called with:', mainName) // Debug log
    setSelectedMain(mainName)
    setDetailSub(null)
    popRef.current?.open(mainName)
  }

  function onShowSubDetail(sub){
    setDetailSub(sub)
  }

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <header className="hero" role="banner">
        <div>
          <h1>React Aria: Component ↔ Subcomponent Explorer</h1>
          <p>This mini one-page site visualizes how subcomponents are shared across React Aria main components. Select a component to see its subcomponents, or pick a subcomponent to highlight all components that use it. Custom components are highlighted.</p>
        </div>
        <button id="themeToggle" className="theme-toggle" type="button" aria-pressed={theme==='dark'} aria-label={theme==='dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme}>
          <span className="icon" dangerouslySetInnerHTML={{__html: theme==='dark' ? ICONS.moon : ICONS.sun}} />
          <span className="label">{theme==='dark' ? 'Dark' : 'Light'}</span>
        </button>
      </header>

      <main id="main" className="container">
        <section className="left" aria-label="Main components">
          <div className="legend" role="note">
            <span className="swatch std" aria-hidden="true"></span> Standard component
            <span className="swatch custom" aria-hidden="true"></span> <strong style={{color:'var(--custom-text)'}}>Custom component</strong>
          </div>
          <div className="search">
            <label className="small" htmlFor="compSearch">Filter components</label>
            <input id="compSearch" type="search" placeholder="Type a component name…" value={filter} onChange={e=>setFilter(e.target.value)} />
          </div>
          <ComponentGrid
            mains={filteredMains}
            mainToSub={data.mainToSub}
            customs={customs}
            selectedMain={selectedMain}
            onOpen={onOpenMain}
          />
        </section>

        <section className="right" aria-label="Insights">
          <div className="panel" aria-labelledby="chartTitle">
            <h2 id="chartTitle">Shared subcomponents</h2>
            <p className="small">Only subcomponents used by <strong>2+ main components</strong>. Click a bar or name to highlight components that use it.</p>
            <div className="chart-wrap">
              <Chart subToMains={data.subToMains} onSelectSub={(s)=>{ setDetailSub(s); }} />
              <div id="chartEmpty" className="chart-empty" hidden> No shared subcomponents to display. </div>
            </div>
          </div>
          <div className="panel" aria-labelledby="detailsTitle">
            <h2 id="detailsTitle">Details</h2>
            <p className="small" id="detailHelp" aria-live="polite">
              {detailSub ? `“${detailSub}” appears in ${(data.subToMains[detailSub]||[]).length} main components:` : 'Select a subcomponent from the chart to see all main components that include it.'}
            </p>
            <div id="detailTags" className="mains-list">
              {detailSub && (data.subToMains[detailSub]||[]).map(m => (
                <button key={m} className="tag-btn" aria-label={`Open ${m}`} onClick={()=>onOpenMain(m)}>{m}</button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Popover
        ref={popRef}
        mainToSub={data.mainToSub}
        subToMains={data.subToMains}
        selectedMain={selectedMain}
        setSelectedMain={setSelectedMain}
        onShowSubDetail={onShowSubDetail}
        docHrefForSub={docHrefForSub}
      />

      <footer className="footer">
        Tip: Press <kbd>Enter</kbd> on any component card to open its subcomponents. In the chart, click a data point to reveal every main component that uses that subcomponent.
      </footer>
    </>
  )
}

export default App
