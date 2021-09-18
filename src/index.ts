import * as Discord from 'discord.js'
import { ApiClient, Events } from 'jellyfin-apiclient'
import * as os from 'os'

const discordClient = new Discord.Client()
const jellyfinClient = new ApiClient(CONFIG['server-adress'], CONFIG['jellyfin-app-name'], '0.0.1', os.hostname(), os.hostname())

try {
  const CONFIG = require('../config.json')

  const jellyfinClientManager = require('./jellyfinclientmanager')

  const discordclientmanager = require('./discordclientmanager')
  discordclientmanager.init()
  const discordClient = discordclientmanager.getDiscordClient()
  const {
    handleChannelMessage
  } = require('./messagehandler')
  const log = require('loglevel')
  const prefix = require('loglevel-plugin-prefix')
  const chalk = require('chalk')
  const colors = {
    TRACE: chalk.magenta,
    DEBUG: chalk.cyan,
    INFO: chalk.blue,
    WARN: chalk.yellow,
    ERROR: chalk.red
  }

  log.setLevel(CONFIG['log-level'])

  prefix.reg(log)
  log.enableAll()

  prefix.apply(log, {
    format (level, name, timestamp) {
      return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](level)} ${chalk.green(`${name}:`)}`
    }
  })

  prefix.apply(log.getLogger('critical'), {
    format (level, name, timestamp) {
      return chalk.red.bold(`[${timestamp}] ${level} ${name}:`)
    }
  })

  jellyfinClientManager.init()
  // TODO Error Checking as the apiclients is inefficent
  jellyfinClientManager.getJellyfinClient().authenticateUserByName(CONFIG['jellyfin-username'], CONFIG['jellyfin-password']).then((response) => {
    jellyfinClientManager.getJellyfinClient().setAuthenticationInfo(response.AccessToken, response.SessionInfo.UserId)
  })

  discordClient.on('message', message => {
    handleChannelMessage(message)
  })

  discordClient.login(CONFIG.token)
} catch (error) {
  console.error(error)
}
