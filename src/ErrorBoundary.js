import React from 'react'

// Catches any render error anywhere in the app and shows a friendly
// recovery screen instead of a blank white page.

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Log for debugging (visible in browser console / Netlify function logs won't see this)
    console.error('App error boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#FAF8F4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 300, color: '#1C1C1C', marginBottom: '10px' }}>
            sensi<em style={{ color: '#3D5C3C', fontStyle: 'italic' }}>fy</em>
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 300, color: '#1C1C1C', marginBottom: '10px' }}>Something went wrong.</div>
          <div style={{ fontSize: '14px', color: '#6A6A62', maxWidth: '340px', lineHeight: 1.6, marginBottom: '24px' }}>
            Sorry about that — an unexpected error occurred. Your data is safe. Reloading usually fixes it.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#3D5C3C', color: 'white', border: 'none', borderRadius: '10px', padding: '13px 28px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
