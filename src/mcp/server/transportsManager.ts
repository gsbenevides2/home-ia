import type { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import type { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

export class TransportsManager {
  private sse = new Map<string, SSEServerTransport>()
  private streamable = new Map<string, StreamableHTTPServerTransport>()

  public addSSE(sessionId: string, transport: SSEServerTransport) {
    this.sse.set(sessionId, transport)
  }

  public addStreamable(
    sessionId: string,
    transport: StreamableHTTPServerTransport
  ) {
    this.streamable.set(sessionId, transport)
  }

  public getSSE(sessionId: string) {
    return this.sse.get(sessionId)
  }

  public getStreamable(sessionId: string) {
    return this.streamable.get(sessionId)
  }

  public removeSSE(sessionId: string) {
    this.sse.delete(sessionId)
  }

  public removeStreamable(sessionId: string) {
    this.streamable.delete(sessionId)
  }

  public checkSessionId(sessionId: string) {
    return this.sse.has(sessionId) || this.streamable.has(sessionId)
  }
}
