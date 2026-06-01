import React from 'react'

/**
 * Generic error boundary — catches render errors in child components so one
 * crashed component doesn't take down the whole page.
 *
 * Usage:
 *   <ErrorBoundary fallback={null}>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] caught:', error?.message, info?.componentStack?.split('\n')?.[1]?.trim())
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}
