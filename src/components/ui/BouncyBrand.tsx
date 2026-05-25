import React, { useRef } from 'react'

// Spring Physics: stiffness=400, damping=10, mass=1
class Spring {
  stiffness: number
  damping: number
  mass: number
  
  constructor(stiffness = 400, damping = 10, mass = 1) {
    this.stiffness = stiffness
    this.damping = damping
    this.mass = mass
  }
  
  step(current: number, velocity: number, target: number, dt: number) {
    const force = -this.stiffness * (current - target) - this.damping * velocity
    velocity += (force / this.mass) * dt
    current += velocity * dt
    return { current, velocity }
  }
  
  isSettled(current: number, velocity: number, target: number) {
    return Math.abs(current - target) < 0.01 && Math.abs(velocity) < 0.01
  }
}

const VARIANTS = { 
  subtle: { y: -3, scale: 1.05, damping: 30 }, 
  prominent: { y: -12, scale: 1.15, damping: 12 } 
}

interface BouncyLetterProps {
  letter: string
  className?: string
  variant?: 'subtle' | 'prominent'
}

const BouncyLetter: React.FC<BouncyLetterProps> = ({ letter, className, variant = 'subtle' }) => {
  const elRef = useRef<HTMLSpanElement>(null)
  const animRef = useRef<number>(0)
  const stateRef = useRef({ cy: 0, cs: 1, vy: 0, vs: 0 })

  const animateTo = (targetY: number, targetScale: number) => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    
    const v = VARIANTS[variant]
    const localSpring = new Spring(400, v.damping, 1)
    
    const dt = 1 / 60
    const tick = () => {
      const state = stateRef.current
      const yr = localSpring.step(state.cy, state.vy, targetY, dt)
      const sr = localSpring.step(state.cs, state.vs, targetScale, dt)
      
      state.cy = yr.current
      state.vy = yr.velocity
      state.cs = sr.current
      state.vs = sr.velocity
      
      if (elRef.current) {
        elRef.current.style.transform = `translateY(${state.cy}px) scale(${state.cs})`
      }
      
      if (!localSpring.isSettled(state.cy, state.vy, targetY) || !localSpring.isSettled(state.cs, state.vs, targetScale)) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        animRef.current = 0
      }
    }
    
    tick()
  }

  const handleMouseEnter = () => {
    const v = VARIANTS[variant]
    animateTo(v.y, v.scale)
  }

  const handleMouseLeave = () => {
    animateTo(0, 1)
  }

  return (
    <span
      ref={elRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`inline-block origin-bottom cursor-default will-change-transform ${className || ''}`}
    >
      {letter === ' ' ? '\u00A0' : letter}
    </span>
  )
}

interface BouncyBrandProps {
  variant?: 'subtle' | 'prominent'
  className?: string
  logo?: boolean
  suffix?: React.ReactNode
}

export const BouncyBrand: React.FC<BouncyBrandProps> = ({ variant = 'subtle', className = '', logo = false, suffix }) => {
  return (
    <div className={`flex select-none font-bold ${className}`}>
      {logo && (
        <span className="flex mr-3">
          <BouncyLetter 
            letter="🦞" 
            variant={variant} 
            className="text-transparent drop-shadow-md" 
          />
        </span>
      )}
      <span className="flex">
        {'Cara'.split('').map((char, i) => (
          <BouncyLetter key={`cara-${i}`} letter={char} variant={variant} className="text-emerald-600 dark:text-emerald-500" />
        ))}
      </span>
      <span className="flex">
        {'Base'.split('').map((char, i) => (
          <BouncyLetter key={`base-${i}`} letter={char} variant={variant} className="text-red-600 dark:text-red-500" />
        ))}
      </span>
      {suffix !== undefined ? suffix : (
        <span className="text-slate-500 dark:text-slate-400 text-[0.6em] font-normal ml-0.5 self-end mb-1 tracking-tighter">©™</span>
      )}
    </div>
  )
}

export default BouncyBrand
