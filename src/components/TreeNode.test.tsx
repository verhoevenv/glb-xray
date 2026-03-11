import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TreeNode } from './TreeNode'
import { ImageContext, type ImageContextValue } from './ImageContext'

describe('TreeNode – primitives', () => {
  it('renders a string value', () => {
    render(<TreeNode label="name" value="Cube" depth={0} />)
    expect(screen.getByText('name')).toBeInTheDocument()
    expect(screen.getByText('"Cube"')).toBeInTheDocument()
  })

  it('renders a number value', () => {
    render(<TreeNode label="count" value={42} depth={0} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders a boolean value', () => {
    render(<TreeNode label="active" value={true} depth={0} />)
    expect(screen.getByText('true')).toBeInTheDocument()
  })

  it('renders null value', () => {
    render(<TreeNode label="empty" value={null} depth={0} />)
    expect(screen.getByText('null')).toBeInTheDocument()
  })

  it('uses data-testid="tree-leaf" for primitives', () => {
    render(<TreeNode label="x" value={1} depth={0} />)
    expect(screen.getByTestId('tree-leaf')).toBeInTheDocument()
  })
})

describe('TreeNode – objects', () => {
  it('renders an expandable node for objects', () => {
    render(<TreeNode label="asset" value={{ version: '2.0' }} depth={0} />)
    expect(screen.getByTestId('tree-node')).toBeInTheDocument()
  })

  it('shows children when expanded (defaultExpanded=true)', () => {
    render(
      <TreeNode
        label="asset"
        value={{ version: '2.0' }}
        depth={0}
        defaultExpanded
      />
    )
    expect(screen.getByTestId('tree-children')).toBeInTheDocument()
    expect(screen.getByText('version')).toBeInTheDocument()
  })

  it('hides children when collapsed', () => {
    render(
      <TreeNode
        label="asset"
        value={{ version: '2.0' }}
        depth={0}
        defaultExpanded={false}
      />
    )
    expect(screen.queryByTestId('tree-children')).not.toBeInTheDocument()
  })

  it('toggles expand on click', () => {
    render(
      <TreeNode
        label="asset"
        value={{ version: '2.0' }}
        depth={0}
        defaultExpanded={false}
      />
    )
    const button = screen.getByRole('button')
    expect(screen.queryByTestId('tree-children')).not.toBeInTheDocument()
    fireEvent.click(button)
    expect(screen.getByTestId('tree-children')).toBeInTheDocument()
    fireEvent.click(button)
    expect(screen.queryByTestId('tree-children')).not.toBeInTheDocument()
  })

  it('toggles expand on Enter key', () => {
    render(
      <TreeNode
        label="asset"
        value={{ version: '2.0' }}
        depth={0}
        defaultExpanded={false}
      />
    )
    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(screen.getByTestId('tree-children')).toBeInTheDocument()
  })

  it('shows collection summary when collapsed', () => {
    render(
      <TreeNode
        label="obj"
        value={{ a: 1, b: 2 }}
        depth={0}
        defaultExpanded={false}
      />
    )
    expect(screen.getByText(/\{2\}/)).toBeInTheDocument()
  })
})

describe('TreeNode – arrays', () => {
  it('renders array elements with bracket labels', () => {
    render(
      <TreeNode
        label="items"
        value={['alpha', 'beta']}
        depth={0}
        defaultExpanded
      />
    )
    expect(screen.getByText('[0]')).toBeInTheDocument()
    expect(screen.getByText('[1]')).toBeInTheDocument()
    expect(screen.getByText('"alpha"')).toBeInTheDocument()
  })

  it('shows array summary when collapsed', () => {
    render(
      <TreeNode
        label="arr"
        value={[1, 2, 3]}
        depth={0}
        defaultExpanded={false}
      />
    )
    expect(screen.getByText(/\[3\]/)).toBeInTheDocument()
  })
})

describe('TreeNode – highlighting', () => {
  it('applies highlighted class when highlighted=true', () => {
    render(<TreeNode label="x" value={1} depth={0} highlighted />)
    const leaf = screen.getByTestId('tree-leaf')
    expect(leaf.className).toMatch(/highlighted/)
  })
})

describe('TreeNode – forceExpanded prop', () => {
  it('forceExpanded=true at high depth starts expanded (overrides depth < 2 default)', () => {
    render(
      <TreeNode label="deep" value={{ x: 1 }} depth={5} forceExpanded={true} />
    )
    expect(screen.getByTestId('tree-children')).toBeInTheDocument()
  })

  it('forceExpanded=false at depth 0 starts collapsed (overrides depth < 2 default)', () => {
    render(
      <TreeNode label="root" value={{ x: 1 }} depth={0} forceExpanded={false} />
    )
    expect(screen.queryByTestId('tree-children')).not.toBeInTheDocument()
  })

  it('forceExpanded=undefined falls back to defaultExpanded', () => {
    render(
      <TreeNode label="root" value={{ x: 1 }} depth={5} defaultExpanded={true} forceExpanded={undefined} />
    )
    expect(screen.getByTestId('tree-children')).toBeInTheDocument()
  })

  it('user can still toggle after forceExpanded sets initial state', () => {
    render(
      <TreeNode label="root" value={{ x: 1 }} depth={0} forceExpanded={false} />
    )
    expect(screen.queryByTestId('tree-children')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByTestId('tree-children')).toBeInTheDocument()
  })

  it('forceExpanded propagates: grandchild content visible with forceExpanded=true', () => {
    render(
      <TreeNode
        label="root"
        value={{ child: { grandchild: 42 } }}
        depth={0}
        forceExpanded={true}
      />
    )
    expect(screen.getByText('grandchild')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })
})

describe('TreeNode – glTF enum annotations', () => {
  it('shows FLOAT for componentType=5126', () => {
    render(<TreeNode label="componentType" value={5126} depth={0} fieldName="componentType" />)
    expect(screen.getByText('FLOAT')).toBeInTheDocument()
  })

  it('shows TRIANGLES for mode=4', () => {
    render(<TreeNode label="mode" value={4} depth={0} fieldName="mode" />)
    expect(screen.getByText('TRIANGLES')).toBeInTheDocument()
  })

  it('does not render annotation for unrecognized value', () => {
    render(<TreeNode label="componentType" value={9999} depth={0} fieldName="componentType" />)
    expect(screen.queryByText(/^[A-Z_]+$/)).not.toBeInTheDocument()
  })

  it('does not render annotation when fieldName is not provided', () => {
    render(<TreeNode label="componentType" value={5126} depth={0} />)
    expect(screen.queryByText('FLOAT')).not.toBeInTheDocument()
  })

  it('does not render annotation for non-enum key with same numeric value', () => {
    render(<TreeNode label="someKey" value={5126} depth={0} fieldName="someKey" />)
    expect(screen.queryByText('FLOAT')).not.toBeInTheDocument()
  })

  it('does not render annotation for string value even with matching fieldName', () => {
    render(<TreeNode label="componentType" value="5126" depth={0} fieldName="componentType" />)
    expect(screen.queryByText('FLOAT')).not.toBeInTheDocument()
  })
})

describe('TreeNode – data URI truncation', () => {
  it('truncates data URI string leaf display', () => {
    const dataUri = 'data:image/png;base64,' + 'A'.repeat(200)
    render(<TreeNode label="uri" value={dataUri} depth={0} />)
    const leaf = screen.getByTestId('tree-leaf')
    expect(leaf.textContent).toContain('…')
    expect(leaf.textContent).not.toContain('A'.repeat(200))
  })

  it('does not truncate regular strings', () => {
    render(<TreeNode label="name" value="hello" depth={0} />)
    expect(screen.getByText('"hello"')).toBeInTheDocument()
  })
})

describe('TreeNode – Preview button with data URI image', () => {
  const baseCtx: ImageContextValue = {
    binChunk: null,
    glbJson: null,
    extraBuffers: new Map(),
  }

  it('shows Preview button for images[0] with data URI uri field', () => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() })
    const dataUri = 'data:image/png;base64,abc'
    render(
      <ImageContext.Provider value={baseCtx}>
        <TreeNode
          label="[0]"
          value={{ uri: dataUri }}
          depth={1}
          path="images[0]"
          defaultExpanded={false}
        />
      </ImageContext.Provider>
    )
    expect(screen.getByTitle('Preview image 0')).toBeInTheDocument()
  })

  it('shows Preview button for images[0] with bufferView (regression)', () => {
    const binChunk = new Uint8Array(10)
    const ctx: ImageContextValue = { binChunk, glbJson: null, extraBuffers: new Map() }
    render(
      <ImageContext.Provider value={ctx}>
        <TreeNode
          label="[0]"
          value={{ bufferView: 0, mimeType: 'image/jpeg' }}
          depth={1}
          path="images[0]"
          defaultExpanded={false}
        />
      </ImageContext.Provider>
    )
    expect(screen.getByTitle('Preview image 0')).toBeInTheDocument()
  })
})

describe('TreeNode – glTF enum annotations (continued)', () => {
  it('wires fieldName through object expansion so child leaf shows annotation', () => {
    render(
      <TreeNode
        label="accessor"
        value={{ componentType: 5126 }}
        depth={0}
        defaultExpanded
      />
    )
    expect(screen.getByText('FLOAT')).toBeInTheDocument()
  })
})
