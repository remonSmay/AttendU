import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import './TopProgressBar.css'

export default function TopProgressBar() {
  const location = useLocation()
  const fillRef = useRef<HTMLDivElement>(null)
  const phase1Ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phase2Ref = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const fill = fillRef.current
    if (!fill) return

    if (phase1Ref.current) clearTimeout(phase1Ref.current)
    if (phase2Ref.current) clearTimeout(phase2Ref.current)

    fill.classList.remove('tpb__fill--running', 'tpb__fill--done')
    void fill.offsetWidth

    fill.classList.add('tpb__fill--running')

    phase1Ref.current = setTimeout(() => {
      fill.classList.remove('tpb__fill--running')
      fill.classList.add('tpb__fill--done')

      phase2Ref.current = setTimeout(() => {
        fill.classList.remove('tpb__fill--done')
      }, 350)
    }, 380)

    return () => {
      if (phase1Ref.current) clearTimeout(phase1Ref.current)
      if (phase2Ref.current) clearTimeout(phase2Ref.current)
    }
  }, [location.key])

  return (
    <div className="tpb" aria-hidden="true" role="presentation">
      <div ref={fillRef} className="tpb__fill" />
    </div>
  )
}
