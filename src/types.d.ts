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
      textField: {
        MDCTextField: {
          new (element: HTMLElement): MDCTextField
        }
      }
      banner: {
        MDCBanner: {
          new (element: HTMLElement): MDCBanner
        }
      }
      autoInit: () => void
    }

    videojs: {
      (element: HTMLElement, options: unknown): VideoJS.Player
      prototype: {
        src: (src: string) => void
      }
    }
  }
}
export {}
