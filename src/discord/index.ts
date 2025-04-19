import { Client, GatewayIntentBits, Partials } from "discord.js";
import { Logger } from "../logger/index.ts";
import { MCPClient } from "../mcp/client.ts";
export class DiscordBot {
  private client: Client;
  private static instance: DiscordBot;

  public static getInstance(): DiscordBot {
    if (!DiscordBot.instance) {
      DiscordBot.instance = new DiscordBot();
    }
    return DiscordBot.instance;
  }

  private constructor() {
    const DISCORD_ALLOWED_USER_ID = Bun.env.DISCORD_ALLOWED_USER_ID;
    const DISCORD_BOT_ID = Bun.env.DISCORD_BOT_ID;
    if (!DISCORD_ALLOWED_USER_ID) {
      throw new Error("DISCORD_ALLOWED_USER_ID is not set");
    }
    if (!DISCORD_BOT_ID) {
      throw new Error("DISCORD_BOT_ID is not set");
    }
    this.client = new Client({
      intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages],
      partials: [Partials.Channel, Partials.Message],
    });

    this.client.on("ready", () => {
      Logger.info("Discord Bot", "Bot is connected to Discord");
    });

    this.client.on("messageCreate", (message) => {
      Logger.info("Discord Bot", "Message received", message);
      const authorId = message.author.id;
      if (authorId === DISCORD_BOT_ID) {
        return;
      }
      if (authorId !== DISCORD_ALLOWED_USER_ID) {
        message.reply("Você não tem permissão para usar este bot.");
        return;
      }
      const content = message.content;
      MCPClient.getInstance().processQuery(content, async (response) => {
        if (response.length > 2000) {
          const lines = response.split("\n");
          const linesBlock = lines.reduce(
            (acc, line) => {
              const lastBlock = acc[acc.length - 1];
              if (lastBlock.length + line.length > 2000) {
                acc.push(line);
              } else {
                acc[acc.length - 1] += line;
              }
              return acc;
            },
            [""]
          );
          for (const block of linesBlock) {
            await message.author.send(block);
          }
        } else {
          await message.author.send(response);
        }
      });
    });
  }

  async connect() {
    const DISCORD_TOKEN = Bun.env.DISCORD_TOKEN;
    if (!DISCORD_TOKEN) {
      Logger.error("Discord Bot", "DISCORD_TOKEN is not set");
      throw new Error("DISCORD_TOKEN is not set");
    }
    Logger.info("Discord Bot", "Logging in to Discord");
    await this.client.login(DISCORD_TOKEN);
  }
}
