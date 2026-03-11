import { createContext } from 'react'

export interface NavigationContextValue {
  navigatePath: string | undefined
  navigateTo: (path: string) => void
  getBackRefs: (path: string) => string[]
  rootKeys: Set<string>
}

export const NavigationContext = createContext<NavigationContextValue>({
  navigatePath: undefined,
  navigateTo: () => {},
  getBackRefs: () => [],
  rootKeys: new Set(),
})
