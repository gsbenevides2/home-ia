import type { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { Logger } from '../../logger/index.ts'

export class TransportsManager {
  private sse = new Map<string, SSEServerTransport>()
  private streamable = new Map<string, StreamableHTTPServerTransport>()

  public addSSE(sessionId: string, transport: SSEServerTransport) {
    Logger.info('TransportsManager', 'Adding SSE transport', { sessionId })
    this.sse.set(sessionId, transport)
  }

  public addStreamable(
    sessionId: string,
    transport: StreamableHTTPServerTransport
  ) {
    Logger.info('TransportsManager', 'Adding streamable transport', {
      sessionId
    })
    this.streamable.set(sessionId, transport)
  }

  public getSSE(sessionId: string) {
    Logger.info('TransportsManager', 'Getting SSE transport', { sessionId })
    return this.sse.get(sessionId)
  }

  public getStreamable(sessionId: string) {
    Logger.info('TransportsManager', 'Getting streamable transport', {
      sessionId
    })
    return this.streamable.get(sessionId)
  }

  public removeSSE(sessionId: string) {
    Logger.info('TransportsManager', 'Removing SSE transport', { sessionId })
    this.sse.delete(sessionId)
  }

  public removeStreamable(sessionId: string) {
    Logger.info('TransportsManager', 'Removing streamable transport', {
      sessionId
    })
    this.streamable.delete(sessionId)
  }

  public checkSessionId(sessionId: string) {
    Logger.info('TransportsManager', 'Checking session ID', { sessionId })
    return this.sse.has(sessionId) || this.streamable.has(sessionId)
  }
}
