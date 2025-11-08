/**
 * Test setup for frontend components
 */

// Mock fetch for testing
global.fetch = jest.fn()

// Mock window.URL for blob downloads
global.URL = {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn(),
} as any

// Preserve real DOM implementations so components can render normally
const realCreateElement = Document.prototype.createElement.bind(document)
const realAppendChild = document.body.appendChild.bind(document.body)
const realRemoveChild = document.body.removeChild.bind(document.body)

Object.defineProperty(document, 'createElement', {
  configurable: true,
  value: jest.fn((tagName: string, options?: ElementCreationOptions) => {
    const element = realCreateElement(tagName, options)
    if (tagName.toLowerCase() === 'a') {
      const anchor = element as HTMLAnchorElement
      anchor.href = ''
      anchor.download = ''
      anchor.style.display = ''
      Object.defineProperty(anchor, 'click', {
        configurable: true,
        value: jest.fn(),
      })
      return anchor
    }
    return element
  }),
})

Object.defineProperty(document.body, 'appendChild', {
  configurable: true,
  value: jest.fn((node: Node) => realAppendChild(node)),
})

Object.defineProperty(document.body, 'removeChild', {
  configurable: true,
  value: jest.fn((node: Node) => realRemoveChild(node)),
})

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
  },
})

// Mock window.dispatchEvent
global.dispatchEvent = jest.fn()

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

// Mock window.location
delete (window as any).location
window.location = {
  href: 'http://localhost:3000',
  search: '',
  pathname: '/',
  origin: 'http://localhost:3000',
} as any

// Mock window.history
window.history = {
  replaceState: jest.fn(),
} as any

