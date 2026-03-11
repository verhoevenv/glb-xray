import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { JsonTree } from './JsonTree'

const data = {
  asset: { version: '2.0', generator: 'Test' },
  meshes: [{ name: 'Cube' }],
  materials: { name: 'Mat' },
}

describe('JsonTree – initial state', () => {
  it('starts with all nodes collapsed', () => {
    render(<JsonTree data={data} />)
    expect(screen.queryByTestId('tree-children')).not.toBeInTheDocument()
  })

  it('renders Collapse all and Expand all buttons', () => {
    render(<JsonTree data={data} />)
    expect(screen.getByTitle('Collapse all')).toBeInTheDocument()
    expect(screen.getByTitle('Expand all')).toBeInTheDocument()
  })
})

describe('JsonTree – expand/collapse controls', () => {
  it('Expand all shows tree-children elements', () => {
    render(<JsonTree data={data} />)
    fireEvent.click(screen.getByTitle('Expand all'))
    const children = screen.getAllByTestId('tree-children')
    expect(children.length).toBeGreaterThan(0)
  })

  it('Collapse all after expanding hides tree-children', () => {
    render(<JsonTree data={data} />)
    fireEvent.click(screen.getByTitle('Expand all'))
    expect(screen.getAllByTestId('tree-children').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByTitle('Collapse all'))
    expect(screen.queryByTestId('tree-children')).not.toBeInTheDocument()
  })
})

describe('JsonTree – search interaction', () => {
  it('search highlights matched top-level nodes', () => {
    render(<JsonTree data={data} />)
    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: 'version' } })
    // asset contains 'version' as a child key — it should be highlighted
    const buttons = screen.getAllByRole('button', { hidden: true })
    const assetButton = buttons.find(b => b.textContent?.includes('asset'))
    expect(assetButton?.closest('[data-testid="tree-node"]')?.querySelector('[aria-expanded]')?.className).toMatch(/highlighted/)
  })

  it('search shows result count', () => {
    render(<JsonTree data={data} />)
    const searchInput = screen.getByRole('searchbox')
    fireEvent.change(searchInput, { target: { value: 'version' } })
    expect(screen.getByText(/paths?/)).toBeInTheDocument()
  })
})
