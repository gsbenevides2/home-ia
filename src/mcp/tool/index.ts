import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SnapshotTool } from './camera/snapshot'
import { SendDiscordMessageTool } from './discord/sendMessage'
import { SendEmailTool } from './email/sendEmail'
import { CreateEventTool } from './google/calendar/createEvent'
import { DeleteEventTool } from './google/calendar/deleteEvent'
import { ListCalendars } from './google/calendar/listCalendars'
import { ListEvents } from './google/calendar/listEvents'
import { UpdateEventTool } from './google/calendar/updateEvent'
import { GetEmailById } from './google/gmail/getEmailById'
import { GetLabels } from './google/gmail/getLabels'
import { GetUnreadEmails } from './google/gmail/getUnreadEmails'
import { ListEmails } from './google/gmail/listEmails'
import { MarkAsRead } from './google/gmail/markAsRead'
import { SearchEmails } from './google/gmail/searchEmails'
import { MovimentDetectionTool } from './home_assistant/camera/movimentDetection'
import { ChangeCodespacesStatusTool } from './home_assistant/codespaces/changeStatus'
import { GetCodespacesStatusTool } from './home_assistant/codespaces/getStatus'
import { GetRoomFanStatusTool } from './home_assistant/fans/getFanStatus'
import { ChangeFanStatusTool } from './home_assistant/fans/setFanStatus'
import { GetRoomLampTool } from './home_assistant/lamps/getRoomLamp'
import { GetRoomLampBrightnessTool } from './home_assistant/lamps/getRoomLampBrightness'
import { SetRoomLampTool } from './home_assistant/lamps/setRoomLamp'
import { SetRoomLampBrightnessTool } from './home_assistant/lamps/setRoomLampBrightness'
import { GetPiholeStatusTool } from './home_assistant/pihole/getStatus'
import { SetPiholeStatusTool } from './home_assistant/pihole/setStatus'
import { GetIdOfPlataformsTool } from './home_assistant/platform_status/getIdOfPlataforms'
import { GetMultiplePlatformStatusTool } from './home_assistant/platform_status/getMultipleStatus'
import { GetPlatformStatusTool } from './home_assistant/platform_status/getStatus'
import { GetPrinterStatusTool } from './home_assistant/printer/getPrinterStatus'
import { GetRouterDataTool } from './home_assistant/router/getRouterData'
import { RebootRouterTool } from './home_assistant/router/rebootRouter'
import { ToggleDataFetchingTool } from './home_assistant/router/toggleDataFetching'
import { ToggleGuestWifiTool } from './home_assistant/router/toggleGuestWifi'
import { GetAlbumTracks } from './home_assistant/spotify/getAlbumTracks'
import { GetArtistAlbums } from './home_assistant/spotify/getArtistAlbums'
import { GetArtistTopTracks } from './home_assistant/spotify/getArtistTopTracks'
import { GetSpotifyData } from './home_assistant/spotify/getData'
import { MakeSpotifyOperation } from './home_assistant/spotify/makeOperation'
import { PlayAlbum } from './home_assistant/spotify/playAlbum'
import { PlayArtist } from './home_assistant/spotify/playArtist'
import { PlaySong } from './home_assistant/spotify/playSong'
import { SearchAlbum } from './home_assistant/spotify/searchAlbum'
import { SearchArtist } from './home_assistant/spotify/searchArtist'
import { SearchSong } from './home_assistant/spotify/searchSong'
import { GetTrainStatus } from './home_assistant/train/getStatus'
import { TurnOffPcTool } from './home_assistant/turnoff_pc'
import { GetStreamerStatusTool } from './home_assistant/twicth/getStatus'
import { GetStreamerIdsTool } from './home_assistant/twicth/getStreamerIds'
import { StartDeviceTool } from './home_assistant/wakeOnLan/startDevice'
import { MarkdownfyWebpage } from './markdownfy/webpage'
import { AddObservationsTool } from './memory/addObservations'
import { CreateEntitiesTool } from './memory/createEntities'
import { CreateRelationsTool } from './memory/createRelations'
import { DeleteEntitiesTool } from './memory/deleteEntities'
import { DeleteObservationsTool } from './memory/deleteObservations'
import { DeleteRelationsTool } from './memory/deleteRelations'
import { OpenNodesTool } from './memory/openNodes'
import { ReadGraphTool } from './memory/readGraph'
import { SearchNodesTool } from './memory/searchNodes'
import { GetBankAccountDataTool } from './pluggy'
import { ChangeJobTool } from './scheduller/changeJob'
import { CreateJobTool } from './scheduller/createJob'
import { CurrentTimeTool } from './scheduller/currentTime'
import { DeleteJobTool } from './scheduller/deleteJob'
import { ListJobTool } from './scheduller/listJob'
import { SendWhatsAppAudioMessageTool } from './whatsapp/sendAudioMessage'
import { SendWhatsAppMessageTool } from './whatsapp/sendMessage'

export const toolList = [
  new GetBankAccountDataTool(),
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
  new GetMultiplePlatformStatusTool(),
  new StartDeviceTool(),
  new GetRouterDataTool(),
  new ToggleGuestWifiTool(),
  new ToggleDataFetchingTool(),
  new RebootRouterTool(),
  new GetSpotifyData(),
  new MakeSpotifyOperation(),
  new SearchSong(),
  new PlaySong(),
  new SendDiscordMessageTool(),
  new CreateJobTool(),
  new ChangeJobTool(),
  new ListJobTool(),
  new DeleteJobTool(),
  new CurrentTimeTool(),
  new MarkdownfyWebpage(),
  new CreateEntitiesTool(),
  new CreateRelationsTool(),
  new AddObservationsTool(),
  new DeleteEntitiesTool(),
  new DeleteObservationsTool(),
  new DeleteRelationsTool(),
  new ReadGraphTool(),
  new SearchNodesTool(),
  new OpenNodesTool(),
  new SendEmailTool(),
  new ListCalendars(),
  new ListEvents(),
  new CreateEventTool(),
  new DeleteEventTool(),
  new UpdateEventTool(),
  new ListEmails(),
  new GetUnreadEmails(),
  new MarkAsRead(),
  new GetEmailById(),
  new SearchEmails(),
  new GetLabels(),
  new SnapshotTool(),
  new SendWhatsAppMessageTool(),
  new SendWhatsAppAudioMessageTool(),
  new GetPrinterStatusTool(),
  new SearchArtist(),
  new SearchAlbum(),
  new GetArtistAlbums(),
  new GetArtistTopTracks(),
  new PlayAlbum(),
  new PlayArtist(),
  new GetAlbumTracks(),
  new TurnOffPcTool()
]

export function registerTools(server: McpServer) {
  toolList.forEach(tool => {
    tool.serverRegister(server)
  })
}
