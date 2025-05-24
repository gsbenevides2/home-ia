declare global {
  interface Window {
    mdc: {
      menu: {
        MDCMenu: {
          new (element: HTMLElement): MDCMenu
          prototype: {
            open: boolean
          }
        }
      }
    }
  }
}
export {}
