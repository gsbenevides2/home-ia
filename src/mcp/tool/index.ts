import { McpServer } from "@modelcontextprotocol/sdk";
import { ChangeCodespacesStatusTool } from "./ChangeCodespacesMachineStatus.ts";
import { GetCodespacesStatusTool } from "./GetCodespacesStatusTool.ts";
import { GetRoomLampTool } from "./GetRoomLampTool.ts";
import { GetTrainStatus } from "./GetTrainStatus.ts";
import { SetRoomLampTool } from "./SetRoomLampTool.ts";

export const toolList = [new GetRoomLampTool(), new SetRoomLampTool(), new GetTrainStatus(), new GetCodespacesStatusTool(), new ChangeCodespacesStatusTool()];

export function registerTools(server: McpServer) {
  toolList.forEach((tool) => {
    tool.serverRegister(server);
  });
}
