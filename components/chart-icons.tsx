"use client"

interface IconProps {
  size?: number
  color?: string
}

export function BullIcon({ size = 24, color = "#4caf50" }: IconProps) {
  return (
    <div 
      className="bull-icon"
      style={{ 
        fontSize: `${size}px`,
        color: color,
        display: 'inline-block'
      }}
    >
      🐂
    </div>
  )
}

export function BearIcon({ size = 24, color = "#ef5350" }: IconProps) {
  return (
    <div 
      className="bear-icon"
      style={{ 
        fontSize: `${size}px`,
        color: color,
        display: 'inline-block'
      }}
    >
      🐻
    </div>
  )
}

export function UpIcon({ size = 24, color = "#4caf50" }: IconProps) {
  return (
    <div 
      style={{ 
        fontSize: `${size}px`,
        color: color,
        display: 'inline-block',
        fontWeight: 'bold'
      }}
    >
      ▲
    </div>
  )
}

export function DownIcon({ size = 24, color = "#ef5350" }: IconProps) {
  return (
    <div 
      style={{ 
        fontSize: `${size}px`,
        color: color,
        display: 'inline-block',
        fontWeight: 'bold'
      }}
    >
      ▼
    </div>
  )
}

export function WinIcon({ size = 24, color = "#4caf50" }: IconProps) {
  return (
    <div 
      style={{ 
        fontSize: `${size}px`,
        color: color,
        display: 'inline-block',
        fontWeight: 'bold'
      }}
    >
      ✓
    </div>
  )
}

export function LoseIcon({ size = 24, color = "#ef5350" }: IconProps) {
  return (
    <div 
      style={{ 
        fontSize: `${size}px`,
        color: color,
        display: 'inline-block',
        fontWeight: 'bold'
      }}
    >
      ✗
    </div>
  )
} 