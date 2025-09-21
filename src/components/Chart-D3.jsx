import React, { useEffect, useMemo, useRef } from 'react'
import * as d3 from 'd3'

export default function Chart({ subToMains, onSelectSub }){
  const svgRef = useRef()
  const wrapRef = useRef()

  const entries = useMemo(()=>{
    const arr = Object.entries(subToMains || {}).filter(([s, arr]) => (arr?.length || 0) > 1)
    arr.sort((a,b)=> a[0].localeCompare(b[0])) // Sort alphabetically by component name
    return arr.map(d => ({ name: d[0], count: d[1].length }))
  }, [subToMains])

  const render = () => {
    const svgEl = svgRef.current
    const svg = d3.select(svgEl)
    const width = Math.max(1000, Math.floor(wrapRef.current?.getBoundingClientRect().width || 1000))
    const height = 500
    svg.selectAll('*').remove()

    // Create tooltip
    const tooltip = d3.select('body').selectAll('.chart-tooltip').data([0])
    const tooltipEnter = tooltip.enter().append('div').attr('class', 'chart-tooltip')
    const tooltipMerged = tooltipEnter.merge(tooltip)
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000)
      .style('box-shadow', '0 2px 8px rgba(0,0,0,0.2)')

    const empty = document.getElementById('chartEmpty')
    if (!entries.length){
      if (empty) empty.hidden = false
      return
    } else {
      if (empty) empty.hidden = true
    }

    const margin = { top: 40, right: 40, bottom: 120, left: 60 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`)

    // Create scales
    const maxCount = d3.max(entries, d => d.count)
    const radiusScale = d3.scaleSqrt().domain([1, maxCount]).range([8, 35])
    const x = d3.scaleBand().domain(entries.map(d => d.name)).range([margin.left, margin.left + innerW]).padding(0.2)
    
    // Position bubbles vertically - higher count = higher position
    const y = d3.scaleLinear().domain([0, maxCount]).nice().range([margin.top + innerH - 50, margin.top + 50])

    // Draw bubbles
    svg.selectAll('.bubble').data(entries).enter().append('circle')
      .attr('class', 'bubble')
      .attr('cx', d => x(d.name) + x.bandwidth() / 2)
      .attr('cy', d => y(d.count))
      .attr('r', d => radiusScale(d.count))
      .style('fill', '#4f46e5')
      .style('fill-opacity', 0.7)
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_, d) => onSelectSub?.(d.name))
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('fill', '#3730a3')
          .style('fill-opacity', 0.9)
          .attr('r', radiusScale(d.count) + 4)
        
        // Show tooltip
        tooltipMerged
          .style('opacity', 1)
          .html(`<strong>${d.name}</strong><br/>Used by ${d.count} component${d.count === 1 ? '' : 's'}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('fill', '#4f46e5')
          .style('fill-opacity', 0.7)
          .attr('r', radiusScale(d.count))
        
        // Hide tooltip
        tooltipMerged.style('opacity', 0)
      })
      .on('mousemove', function(event, d) {
        // Update tooltip position as mouse moves
        tooltipMerged
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px')
      })

    // Add x-axis with component labels
    svg.append('g')
      .attr('class', 'axis x')
      .attr('transform', `translate(0, ${margin.top + innerH})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '11px')

    // Add y-axis for count values
    svg.append('g')
      .attr('class', 'axis y')
      .attr('transform', `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('d')))

    // Add count labels inside bubbles
    svg.selectAll('.count-label').data(entries).enter().append('text')
      .attr('class', 'count-label')
      .attr('x', d => x(d.name) + x.bandwidth() / 2)
      .attr('y', d => y(d.count))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', d => `${Math.min(12, radiusScale(d.count) / 2.5)}px`)
      .style('fill', '#fff')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => d.count)
  }

  useEffect(render, [entries, onSelectSub])

  useEffect(()=>{
    const ro = new ResizeObserver(render)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return ()=> {
      ro.disconnect()
      // Clean up tooltip on unmount
      d3.select('body').selectAll('.chart-tooltip').remove()
    }
  }, [])

  return (
    <div className="chart" ref={wrapRef}>
      <svg ref={svgRef} width="100%" height="380" role="img" aria-label="Bubble chart of shared subcomponents"></svg>
    </div>
  )
}
