import { Twitch } from './clients/homeAssistant/MySensors/Twitch'

console.log(await Twitch.getStreamerStatus('KuroiTheBunny'))
