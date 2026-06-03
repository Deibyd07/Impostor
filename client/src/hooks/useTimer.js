import { useEffect, useRef, useState } from 'react'

// Countdown timer en segundos. Pausable. onEnd se dispara al llegar a 0.
export function useTimer(initialSeconds, { autoStart = true, onEnd } = {}) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [running, setRunning] = useState(autoStart)
  const endedRef = useRef(false)

  useEffect(() => {
    setSeconds(initialSeconds)
    endedRef.current = false
  }, [initialSeconds])

  useEffect(() => {
    if (!running) return
    if (seconds <= 0) {
      if (!endedRef.current) {
        endedRef.current = true
        onEnd?.()
      }
      return
    }
    const id = setTimeout(() => setSeconds(s => Math.max(0, s - 1)), 1000)
    return () => clearTimeout(id)
  }, [running, seconds, onEnd])

  return {
    seconds,
    progress: initialSeconds > 0 ? seconds / initialSeconds : 0,
    running,
    start: () => setRunning(true),
    pause: () => setRunning(false),
    reset: (newSeconds = initialSeconds) => {
      setSeconds(newSeconds)
      endedRef.current = false
    },
  }
}
