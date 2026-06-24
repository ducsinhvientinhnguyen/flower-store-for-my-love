import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

export default function ParallaxLayer({ children, className = '', offset = 80 }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset])

  return (
    <div ref={ref} className={className} style={{ overflow: 'hidden', position: 'relative' }}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  )
}
