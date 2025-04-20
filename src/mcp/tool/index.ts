import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetTrainStatus } from "./GetTrainStatus.ts";
import { ChangeCodespacesStatusTool } from "./home_assistant/codespaces/changeStatus.ts";
import { GetCodespacesStatusTool } from "./home_assistant/codespaces/getStatus.ts";
import { GetRoomFanStatusTool } from "./home_assistant/fans/getFanStatus.ts";
import { ChangeFanStatusTool } from "./home_assistant/fans/setFanStatus.ts";
import { GetRoomLampTool } from "./home_assistant/lamps/getRoomLamp.ts";
import { GetRoomLampBrightnessTool } from "./home_assistant/lamps/getRoomLampBrightness.ts";
import { SetRoomLampTool } from "./home_assistant/lamps/setRoomLamp.ts";
import { SetRoomLampBrightnessTool } from "./home_assistant/lamps/setRoomLampBrightness.ts";
import { GetPiholeStatusTool } from "./home_assistant/pihole/getStatus.ts";
import { SetPiholeStatusTool } from "./home_assistant/pihole/setStatus.ts";

export const toolList = [new GetRoomLampTool(), new SetRoomLampTool(), new GetTrainStatus(), new GetCodespacesStatusTool(), new ChangeCodespacesStatusTool(), new SetRoomLampBrightnessTool(), new GetRoomLampBrightnessTool(), new GetRoomFanStatusTool(), new ChangeFanStatusTool(), new GetPiholeStatusTool(), new SetPiholeStatusTool()];

export function registerTools(server: McpServer) {
  toolList.forEach((tool) => {
    tool.serverRegister(server);
  });
}
