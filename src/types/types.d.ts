import type Axios from 'axios'
import type * as MDC from 'material-components-web'
declare global {
  interface Window {
    mdc: typeof MDC

    videojs: {
      (element: HTMLElement, options: unknown): VideoJS.Player
      prototype: {
        src: (src: string) => void
      }
    }

    axios: typeof Axios
  }
}
export {}
