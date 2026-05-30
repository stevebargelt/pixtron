import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import fs from 'fs'
import path from 'path'
import Home from '@/pages/index'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Navigation } from '@/components/layout/Navigation'

const DOCUMENT_PATH = path.resolve(process.cwd(), 'src/pages/_document.tsx')

const renderWithProviders = (ui: React.ReactElement) =>
  render(<ThemeProvider defaultTheme="light">{ui}</ThemeProvider>)

// ─── 1. Login page wordmark ──────────────────────────────────────────────────

describe('Pixtron brand — login page wordmark', () => {
  it('renders an <img> with alt="Pixtron" on the unauthenticated login page', async () => {
    renderWithProviders(<Home />)
    const img = await screen.findByAltText('Pixtron')
    expect(img).toBeInTheDocument()
    expect(img.tagName).toBe('IMG')
  })

  it('Pixtron wordmark appears before the auth form in the DOM', async () => {
    renderWithProviders(<Home />)
    const img = await screen.findByAltText('Pixtron')
    const signInText = await screen.findByText(/sign in to manage/i)
    // img must precede the auth card text in document order
    expect(
      img.compareDocumentPosition(signInText) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })
})

// ─── 2. Navigation brand mark link ──────────────────────────────────────────

describe('Pixtron brand — Navigation brand mark link', () => {
  it('renders a link to "/" whose accessible name is "Pixtron"', async () => {
    render(<Navigation />)
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /^pixtron$/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/')
    })
  })

  it('"LED Admin" label is visible in the sidebar', async () => {
    render(<Navigation />)
    await waitFor(() => {
      expect(screen.getByText('LED Admin')).toBeInTheDocument()
    })
  })

  it('"LED Admin" text is NOT inside the home "/" link (admin-removal invariant)', async () => {
    render(<Navigation />)
    await waitFor(() => {
      const homeLink = screen.getByRole('link', { name: /^pixtron$/i })
      expect(homeLink).not.toHaveTextContent(/led admin/i)
    })
  })

  it('no link has "admin" in its accessible name', async () => {
    render(<Navigation />)
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /admin/i })).toBeNull()
    })
  })
})

// ─── 3. _document head link tags (static analysis) ──────────────────────────

describe('Pixtron brand — _document head link tags', () => {
  const src = fs.readFileSync(DOCUMENT_PATH, 'utf8')

  it('includes rel="icon" href="/favicon.ico"', () => {
    expect(src).toContain('href="/favicon.ico"')
  })

  it('includes rel="apple-touch-icon" href="/brand/apple-touch-icon.png"', () => {
    expect(src).toMatch(/rel="apple-touch-icon"/)
    expect(src).toContain('href="/brand/apple-touch-icon.png"')
  })

  it('includes SVG icon link for pixtron-lettermark.svg with type="image/svg+xml"', () => {
    expect(src).toContain('href="/brand/pixtron-lettermark.svg"')
    expect(src).toContain('type="image/svg+xml"')
  })
})
