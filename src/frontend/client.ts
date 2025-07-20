import { treaty } from '@elysiajs/eden'
import type { App } from '../routers'

export const client = treaty<App>(window.location.origin)
