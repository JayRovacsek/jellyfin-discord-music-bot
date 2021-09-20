import * as Discord from 'discord.js'
import { client as DiscordClient } from './discord'
import { discordPrefix } from './config'

const discordClient = DiscordClient()

discordClient.on('message', async (message: Discord.Message) => {
  if (message.content.startsWith(discordPrefix)) {
    const result = await discordClient.handleMessage(message)
    if (result.status === 'failure' && result.message) {
      console.warn(result.message)
    }
  }
})

const exitHandler = () => {
  discordClient.closeJellyfinWebsocket()
}

['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException', 'SIGTERM'].forEach((eventType) => {
  process.on(eventType, exitHandler.bind(null, { exit: true }))
})
