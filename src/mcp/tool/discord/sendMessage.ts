import type { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DiscordBot } from "../../../discord";
import { AbstractTool } from "../AbstractTool";

const args = {
    message: z.string().describe("The message will be sended")
}

type Args = typeof args

export class SendDiscordMessageTool extends AbstractTool<Args> {
    name = "send-discord-message"
    description = "Send a message to a my discord chat"
    args = args

    execute: ToolCallback<Args> = async args => {
        const { message } = args
        await DiscordBot.getInstance().sendMessage(message)
        return {
            content: [{
                type: "text",
                text: "Message sent"
            }]
        }
    }
}