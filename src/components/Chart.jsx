import React, { useMemo, useRef, useEffect } from 'react'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bubble } from 'react-chartjs-2'

ChartJS.register(LinearScale, PointElement, Tooltip, Legend)

// Helper function to get CSS variable values
const getCSSVariable = (variable) => {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  }
  return ''
}

// Helper function to convert CSS color to rgba with opacity using CSS color functions
const getRGBAColor = (cssVar, opacity = 1) => {
  const color = getCSSVariable(cssVar)
  // Use CSS color-mix function or rgb with alpha
  if (opacity === 1) {
    return color
  }
  // Use CSS color function to add alpha channel
  return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`
}

export default function Chart({ subToMains, onSelectSub }) {
  const chartRef = useRef(null)
  const containerRef = useRef(null)
  const [focusedIndex, setFocusedIndex] = React.useState(-1)

  const { data, isEmpty } = useMemo(() => {
    const arr = Object.entries(subToMains || {}).filter(([s, arr]) => (arr?.length || 0) > 1)
    
    if (arr.length === 0) {
      return { data: null, isEmpty: true }
    }

    arr.sort((a, b) => a[0].localeCompare(b[0])) // Sort alphabetically by component name
    
    // Get theme colors
    const accentColor = getCSSVariable('--accent')
    const linkHoverColor = getCSSVariable('--link-hover')
    
    const chartData = {
      datasets: [
        {
          label: 'Shared Subcomponents',
          data: arr.map(([name, usageArray], index) => ({
            x: index, // Position along x-axis (alphabetical order)
            y: usageArray.length, // Count determines y-position
            r: Math.max(8, Math.min(25, usageArray.length * 3)), // Bubble size based on count
            componentName: name,
            count: usageArray.length
          })),
          backgroundColor: getRGBAColor('--accent', 0.7),
          borderColor: accentColor,
          borderWidth: 2,
          hoverBackgroundColor: getRGBAColor('--link-hover', 0.9),
          hoverBorderColor: linkHoverColor,
        },
      ],
    }

    return { data: chartData, isEmpty: false }
  }, [subToMains])

  const options = useMemo(() => {
    // Get theme colors for chart options
    const textColor = getCSSVariable('--text')
    const mutedColor = getCSSVariable('--muted')
    const panelBorderColor = getCSSVariable('--panel-border')
    const bgColor = getCSSVariable('--bg')
    const panelColor = getCSSVariable('--panel')
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: (context) => {
              const point = context[0].raw
              return point.componentName
            },
            label: (context) => {
              const point = context.raw
              return `Used by ${point.count} component${point.count === 1 ? '' : 's'}`
            },
          },
          backgroundColor: getRGBAColor('--panel', 0.95),
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: panelBorderColor,
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          titleFont: {
            weight: 'bold',
          },
          bodyFont: {
            size: 12,
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          ticks: {
            stepSize: 1,
            callback: (value, index) => {
              // Show component names as x-axis labels
              if (data && data.datasets[0].data[value]) {
                return data.datasets[0].data[value].componentName
              }
              return ''
            },
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 11,
            },
            color: mutedColor,
          },
          grid: {
            display: false,
          },
          border: {
            color: panelBorderColor,
          },
          title: {
            display: true,
            text: 'Components (alphabetical)',
            font: {
              size: 12,
              weight: 'bold',
            },
            color: textColor,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 11,
            },
            color: mutedColor,
          },
          grid: {
            color: getRGBAColor('--panel-border', 0.5),
          },
          border: {
            color: panelBorderColor,
          },
          title: {
            display: true,
            text: 'Number of Components Using',
            font: {
              size: 12,
              weight: 'bold',
            },
            color: textColor,
          },
        },
      },
      onClick: (event, elements) => {
        console.log('Chart clicked, elements:', elements) // Debug log
        if (elements.length > 0) {
          const elementIndex = elements[0].index
          const componentName = data.datasets[0].data[elementIndex].componentName
          console.log('Calling onSelectSub with:', componentName) // Debug log
          onSelectSub?.(componentName)
        }
      },
      interaction: {
        intersect: false,
        mode: 'point',
      },
      // Add hover effects for focused elements
      onHover: (event, elements) => {
        if (elements.length > 0) {
          const elementIndex = elements[0].index
          setFocusedIndex(elementIndex)
        }
      },
    }
  }, [data, focusedIndex])

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!data || !data.datasets[0].data.length) return
      
      const dataPoints = data.datasets[0].data
      const maxIndex = dataPoints.length - 1
      
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => prev < maxIndex ? prev + 1 : 0)
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => prev > 0 ? prev - 1 : maxIndex)
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < dataPoints.length) {
            const componentName = dataPoints[focusedIndex].componentName
            onSelectSub?.(componentName)
          }
          break
        case 'Home':
          event.preventDefault()
          setFocusedIndex(0)
          break
        case 'End':
          event.preventDefault()
          setFocusedIndex(maxIndex)
          break
      }
    }

    const chartContainer = containerRef.current
    if (chartContainer) {
      chartContainer.addEventListener('keydown', handleKeyDown)
      return () => {
        chartContainer.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [data, focusedIndex, onSelectSub])

  // Update bubble colors and tooltip based on focus
  useEffect(() => {
    if (data && chartRef.current) {
      const chart = chartRef.current
      const dataset = chart.data.datasets[0]
      
      // Reset all bubble colors
      dataset.backgroundColor = dataset.data.map((_, index) => 
        index === focusedIndex 
          ? getRGBAColor('--link-hover', 0.9)
          : getRGBAColor('--accent', 0.7)
      )
      dataset.borderColor = dataset.data.map((_, index) => 
        index === focusedIndex 
          ? getCSSVariable('--link-hover')
          : getCSSVariable('--accent')
      )
      
      // Show tooltip for focused element
      if (focusedIndex >= 0) {
        const activeElements = [{
          datasetIndex: 0,
          index: focusedIndex
        }]
        chart.setActiveElements(activeElements)
        chart.tooltip.setActiveElements(activeElements, { x: 0, y: 0 })
      } else {
        // Hide tooltip when no element is focused
        chart.setActiveElements([])
        chart.tooltip.setActiveElements([], { x: 0, y: 0 })
      }
      
      chart.update('none') // Update without animation for smooth focus changes
    }
  }, [focusedIndex, data])

  if (isEmpty) {
    return (
      <div id="chartEmpty" className="chart-empty">
        <p>No shared subcomponents found</p>
      </div>
    )
  }

  return (
    <div className="chart-wrap">
      <div 
        ref={containerRef}
        className="chart" 
        style={{ height: '500px', width: '100%' }}
        tabIndex={0}
        role="application"
        aria-label="Interactive bubble chart of shared subcomponents. Use arrow keys to navigate, Enter or Space to select."
        onFocus={() => {
          if (focusedIndex === -1 && data && data.datasets[0].data.length > 0) {
            setFocusedIndex(0)
          }
        }}
        onBlur={() => setFocusedIndex(-1)}
      >
        <Bubble ref={chartRef} data={data} options={options} />
        {/* Screen reader live region for focus announcements */}
        <div 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
          style={{ 
            position: 'absolute', 
            left: '-9999px', 
            width: '1px', 
            height: '1px', 
            overflow: 'hidden' 
          }}
        >
          {focusedIndex >= 0 && data && data.datasets[0].data[focusedIndex] && 
            `Focused on ${data.datasets[0].data[focusedIndex].componentName}, used by ${data.datasets[0].data[focusedIndex].count} components. Press Enter to select.`
          }
        </div>
      </div>
    </div>
  )
}
