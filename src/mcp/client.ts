import Anthropic from "@anthropic-ai/sdk";
import { ContentBlockParam, ImageBlockParam, MessageParam, TextBlockParam, Tool, ToolResultBlockParam, ToolUseBlockParam } from "@anthropic-ai/sdk/resources/messages/messages.mjs";
import { OAuthClientMetadata, OAuthClientProvider } from "@modelcontextprotocol/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { DatabaseClient } from "../clients/Postgres.ts";

const systemPrompt = await Deno.readTextFile("./src/mcp/systemPrompt.txt");

class EnvironmentOAuthProvider implements OAuthClientProvider {
  redirectUrl = new URL("http://localhost:3000/sse");
  clientMetadata: OAuthClientMetadata = {};
  clientInformation = () => {
    return {
      client_id: "mcp-client-cli",
      client_secret: "mcp-client-cli-secret",
      client_id_issued_at: Date.now(),
      client_secret_expires_at: Date.now() + 1000 * 60 * 60 * 24 * 30,
    };
  };
  tokens = () => {
    return {
      access_token: Deno.env.get("AUTH_TOKEN")!,
      token_type: "Bearer",
    };
  };
  saveTokens = () => {};
  redirectToAuthorization = () => {};
  saveCodeVerifier = () => {};
  codeVerifier = () => {
    return "1234567890";
  };
}

export class MCPClient {
  private static instance: MCPClient;

  public static getInstance(): MCPClient {
    if (!MCPClient.instance) {
      MCPClient.instance = new MCPClient();
    }
    return MCPClient.instance;
  }

  private mcp: Client;
  private anthropic: Anthropic;
  private transport: SSEClientTransport | null = null;
  private tools: Tool[] = [];

  private messages: MessageParam[] = [];

  private constructor() {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });
    this.mcp = new Client({ name: "mcp-client-cli", version: "1.0.0" });
  }
  // methods will go here

  async connectToServer() {
    try {
      this.transport = new SSEClientTransport(new URL("http://localhost:3000/sse"), {
        authProvider: new EnvironmentOAuthProvider(),
      });
      await this.mcp.connect(this.transport);

      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools.map((tool) => {
        return {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema,
        };
      });
      console.log(
        "Connected to MCP server with tools:",
        this.tools.map(({ name }) => name)
      );
      await this.loadOldMessages();
      console.log("Loaded old messages:", this.messages);
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  async processQuery(query: string, onMessage: (message: string) => Promise<void>) {
    await this.saveMessage("user", [
      {
        type: "text",
        text: query,
      },
    ]);
    const dispatchMessage = async () => {
      try {
        const response = await this.anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1000,
          messages: this.messages,
          system: systemPrompt,
          tools: this.tools,
        });
        const fixedContent = this.fixMessageOrder(response.content);
        await this.saveMessage("assistant", fixedContent);
        for (const content of fixedContent) {
          if (content.type === "text") {
            console.log("Text:", content);
            await onMessage(content.text);
          } else if (content.type === "tool_use") {
            console.log("Tool use:", content);
            const toolName = content.name;
            const toolUseID = content.id;
            const toolInput = content.input as { [x: string]: unknown } | undefined;
            const result = await this.mcp.callTool({
              name: toolName,
              arguments: toolInput,
            });
            console.log("Tool result:", result);
            await this.saveMessage("user", [
              {
                type: "tool_result",
                tool_use_id: toolUseID,
                content: result.content as Array<TextBlockParam | ImageBlockParam> | string,
              },
            ]);
            await dispatchMessage();
          }
        }
      } catch (e) {
        console.log("Error processing query:", e);
        const isToolUseError = e.message.includes("`tool_use` ids were found without `tool_result`");
        console.log("Is tool use error:", isToolUseError);
        if (isToolUseError) {
          await this.clearMessages();
          await this.processQuery(query, onMessage);
        } else {
          console.log("Error is not a tool use error, rethrowing");
          console.log(e);
          await onMessage("Ocorreu um erro ao processar a sua solicitação. Por favor, tente novamente mais tarde.");
        }
      }
    };
    await dispatchMessage();
  }

  async loadOldMessages(): Promise<void> {
    const client = await DatabaseClient.getConnection();
    const messages = await client.queryObject<{
      content: Array<ContentBlockParam>;
      role: "user" | "assistant";
    }>('SELECT c.content, c.role FROM chatbot c ORDER BY c."date" DESC LIMIT 10');
    await client.release();

    this.messages = messages.rows.reverse();
    const firstMessage = this.messages[0];
    if (Array.isArray(firstMessage.content)) {
      const includesTool = firstMessage.content.some((el: ContentBlockParam) => el.type.includes("tool"));
      if (includesTool) {
        this.removeVeryOldMessages();
      }
    }
  }

  fixMessageOrder(message: Array<ContentBlockParam>) {
    // text should be the first element
    return message.sort((a, b) => {
      if (a.type === "text" && b.type !== "text") {
        return -1;
      } else if (a.type !== "text" && b.type === "text") {
        return 1;
      }
      return 0;
    });
  }

  removeVeryOldMessages() {
    const firstMessage = this.messages[0];
    if (Array.isArray(firstMessage.content)) {
      const includesTool = firstMessage.content.find((el: ContentBlockParam) => el.type.includes("tool_use")) as ToolUseBlockParam | undefined;
      if (includesTool) {
        const correspondingToolResult = this.messages.findIndex((el) => {
          if (Array.isArray(el.content)) {
            return el.content.find((el2: ContentBlockParam) => el2.type.includes("tool_result") && (el2 as ToolResultBlockParam).tool_use_id === includesTool.id);
          }
          return false;
        });
        if (correspondingToolResult) {
          const removedMessage = this.messages.splice(0, correspondingToolResult + 1);
          console.log("Removed message:", removedMessage);
        }
      } else {
        this.messages.shift();
      }
    } else {
      this.messages.shift();
    }
  }

  async saveMessage(role: "user" | "assistant", message: Array<ContentBlockParam>) {
    if (this.messages.length > 10) {
      this.removeVeryOldMessages();
    }

    this.messages.push({
      role: role,
      content: message,
    });
    const client = await DatabaseClient.getConnection();
    await client.queryArray(`INSERT INTO chatbot (role, content) VALUES ($1, $2)`, [role, JSON.stringify(message)]);
    await client.release();
  }

  async cleanup() {
    await this.mcp.close();
  }

  async clearMessages() {
    this.messages = [];
    const client = await DatabaseClient.getConnection();
    await client.queryArray(`DELETE FROM chatbot`);
    await client.release();
  }
}
