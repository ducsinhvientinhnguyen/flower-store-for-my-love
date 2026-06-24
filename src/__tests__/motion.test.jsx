import { render, screen } from '@testing-library/react'
import FadeInView from '../components/motion/FadeInView'
import ParallaxLayer from '../components/motion/ParallaxLayer'
import PageTransition from '../components/motion/PageTransition'

describe('motion primitives', () => {
  it('FadeInView renders its children', () => {
    render(<FadeInView><p>hello</p></FadeInView>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('ParallaxLayer renders its children', () => {
    render(<ParallaxLayer><p>parallax</p></ParallaxLayer>)
    expect(screen.getByText('parallax')).toBeInTheDocument()
  })

  it('PageTransition renders its children', () => {
    render(<PageTransition><p>page</p></PageTransition>)
    expect(screen.getByText('page')).toBeInTheDocument()
  })
})
