"use client"

import { useEffect, useState } from 'react'
import ReactConfetti from 'react-confetti'

export function Confetti() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <ReactConfetti
      width={windowSize.width}
      height={windowSize.height}
      recycle={false}
      numberOfPieces={500}
      gravity={0.15}
      colors={['#26a69a', '#4caf50', '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9', '#ffeb3b', '#ffc107', '#ff9800']}
    />
  )
} 