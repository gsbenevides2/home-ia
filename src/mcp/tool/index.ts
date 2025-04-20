import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { MovimentDetectionTool } from './home_assistant/camera/movimentDetection.ts'
import { ChangeCodespacesStatusTool } from './home_assistant/codespaces/changeStatus.ts'
import { GetCodespacesStatusTool } from './home_assistant/codespaces/getStatus.ts'
import { GetRoomFanStatusTool } from './home_assistant/fans/getFanStatus.ts'
import { ChangeFanStatusTool } from './home_assistant/fans/setFanStatus.ts'
import { GetRoomLampTool } from './home_assistant/lamps/getRoomLamp.ts'
import { GetRoomLampBrightnessTool } from './home_assistant/lamps/getRoomLampBrightness.ts'
import { SetRoomLampTool } from './home_assistant/lamps/setRoomLamp.ts'
import { SetRoomLampBrightnessTool } from './home_assistant/lamps/setRoomLampBrightness.ts'
import { GetPiholeStatusTool } from './home_assistant/pihole/getStatus.ts'
import { SetPiholeStatusTool } from './home_assistant/pihole/setStatus.ts'
import { GetIdOfPlataformsTool } from './home_assistant/platform_status/getIdOfPlataforms.ts'
import { GetPlatformStatusTool } from './home_assistant/platform_status/getStatus.ts'
import { GetSpotifyData } from './home_assistant/spotify/getData.ts'
import { MakeSpotifyOperation } from './home_assistant/spotify/makeOperation.ts'
import { GetTrainStatus } from './home_assistant/train/getStatus.ts'
import { GetStreamerStatusTool } from './home_assistant/twicth/getStatus.ts'
import { GetStreamerIdsTool } from './home_assistant/twicth/getStreamerIds.ts'
import { StartDeviceTool } from './home_assistant/wakeOnLan/startDevice.ts'

export const toolList = [
  new GetRoomLampTool(),
  new SetRoomLampTool(),
  new GetTrainStatus(),
  new GetCodespacesStatusTool(),
  new ChangeCodespacesStatusTool(),
  new SetRoomLampBrightnessTool(),
  new GetRoomLampBrightnessTool(),
  new GetRoomFanStatusTool(),
  new ChangeFanStatusTool(),
  new GetPiholeStatusTool(),
  new SetPiholeStatusTool(),
  new MovimentDetectionTool(),
  new GetStreamerIdsTool(),
  new GetStreamerStatusTool(),
  new GetPlatformStatusTool(),
  new GetIdOfPlataformsTool(),
  new StartDeviceTool(),
  new GetSpotifyData(),
  new MakeSpotifyOperation()
]

export function registerTools(server: McpServer) {
  toolList.forEach(tool => {
    tool.serverRegister(server)
  })
}
