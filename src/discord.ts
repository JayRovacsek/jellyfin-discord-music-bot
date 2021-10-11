/* eslint-disable no-unused-vars */
import * as Discord from 'discord.js'
import { discordPrefix, jellyfinServerAddress, jellyfinAppName, discordToken } from './config'
/* @ts-ignore */
import ApiClient from 'jellyfin-apiclient'
import * as os from 'os'
import { exit } from 'process'
import { SearchResult } from './jellyfin/types'
import { parsePlaySubcommand, randomColour } from './util'

type Result = {
  status: 'success' | 'failure';
  message?: string;
}

export enum ShortIntent {
  Play = 'p',
  Summon = 'su',
  Disconnect = 'd',
  Pause = 'p',
  Resume = 'r',
  Stop = 't',
  Skip = 's',
  Add ='a',
  Help = 'h',
}

export enum LongIntent {
  Play = 'play',
  Summon = 'summon',
  Disconnect = 'disconnect',
  Pause = 'pause',
  Resume = 'resume',
  Stop = 'stop',
  Skip = 'skip',
  Add ='add',
  Help = 'help',
}

export type Intent = ShortIntent | LongIntent

type JellyfinItem = string
type FallbackItem = string
type Playlistitem = JellyfinItem | FallbackItem

type ProgressPayload = {
  canSeek: boolean,
  isMuted: boolean,
  isPaused: boolean,
  itemId: string | null,
  mediaSourceId: string | null,
  nowPlayingQueue: Playlistitem[]
  playMethod: string,
  playSessionId: string,
  playlistItemId: string | null,
  positionTicks: number,
  repeatMode: boolean,
  volumeLevel: number,
  eventName: string
}

// const hasSubcommands = (intent: string): boolean => {
//   if (intent in ShortIntent || intent in LongIntent) {
//     return [ShortIntent.Play, ShortIntent.Skip, ShortIntent, LongIntent.Play, LongIntent.Skip].some(i => intent === i)
//   }
//   return false
// }

export const parseIntent = (input: string): Intent | undefined => {
  const parsedIntent = input
    .trim()
    .substring(1)
    .split(' ')[0]
  if (parsedIntent in ShortIntent || parsedIntent in LongIntent) return parsedIntent as Intent
  return undefined
}

export class Client extends Discord.Client {
  jellyfinClient: ApiClient;
  playlistIndex: number;
  playlist: Playlistitem[];
  playbackBitrate: number;
  progressPayload: ProgressPayload;
  currentlyPlaying: boolean;

  constructor () {
    super()
    this.jellyfinClient = new ApiClient(jellyfinServerAddress, jellyfinAppName, '0.0.2', os.hostname(), os.hostname())
    this.playlistIndex = 0
    this.playlist = []
    this.playbackBitrate = 0
    this.currentlyPlaying = false
    this.progressPayload = {
      canSeek: true,
      isMuted: false,
      isPaused: false,
      itemId: null,
      mediaSourceId: null,
      nowPlayingQueue: [],
      playMethod: 'DirectPlay',
      playSessionId: 'ae2436edc6b91b11d72aeaa67f84e0ea',
      playlistItemId: null,
      positionTicks: 0,
      repeatMode: false,
      volumeLevel: 100,
      eventName: 'pauseplayupdate'
    }
    this.login(discordToken).catch(error => {
      console.info('An error occured authenticating with Discord, please refer to the below message for more info.')
      if (typeof error === 'string') { console.error(error) }
      if (typeof error === 'object') { console.error(JSON.stringify(error, null, 4)) }
      exit(1)
    })
    this.openJellyfinWebsocket().catch(error => {
      console.info('An error occured opening a websocket with Jellyfin, please refer to the below message for more info.')
      if (typeof error === 'string') { console.error(error) }
      if (typeof error === 'object') { console.error(JSON.stringify(error, null, 4)) }
      exit(1)
    })
  }

  async openJellyfinWebsocket (): Promise<void> {
    try {
      this.jellyfinClient.openWebSocket()
    } catch (error) {
      console.error(error)
      exit(1)
    }
  }

  closeJellyfinWebsocket () {
    try {
      this.jellyfinClient.openWebSocket()
    } catch (error) {
      console.error(error)
      exit(1)
    }
  }

  async updatePlaybackPayload () {
    const payload = await this.jellyfinClient.reportPlaybackProgress({ userId: this.jellyfinClient.getCurrentUserId(), itemId: this.progressPayload.itemId })
    this.progressPayload = payload
  }

  streamURLbuilder (itemID: string, bitrate: number): string {
    const supportedCodecs = 'opus'
    const supportedContainers = 'ogg,opus'
    return `${this.jellyfinClient.serverAddress()}/Audio/${itemID}/universal?UserId=${this.jellyfinClient.getCurrentUserId()}&DeviceId=${this.jellyfinClient.deviceId()}&MaxStreamingBitrate=${bitrate}&Container=${supportedContainers}&AudioCodec=${supportedCodecs}&api_key=${this.jellyfinClient.accessToken()}&TranscodingContainer=ts&TranscodingProtocol=hls`
  }

  async connect (message: Discord.Message) {
    const voiceChannel = message.member?.voice.channel
    if (voiceChannel) {
      voiceChannel.join()
      this.playbackBitrate = voiceChannel.bitrate
    }
  }

  async disconnect () {
    this.jellyfinClient.closeWebSocket()
    this.user?.client.voice?.connections.forEach(connection => connection.disconnect())
    this.playlist = []
    this.playlistIndex = 0
    this.playbackBitrate = 0
  }

  async search (term: string, types: string[]): Promise<SearchResult> {
    const includeTypes = types.join(',')
    const searchResults: SearchResult = this.jellyfinClient.getSearchHints({ searchTerm: term, includeTypes })
    return searchResults
  }

  add (items: string[]): void {
    this.playlist = [...this.playlist, ...items]
  }

  async pause (message: Discord.Message): Promise<void> {
    const voiceConnection = this.user?.client.voice?.connections.first()
    if (voiceConnection) {
      const nowPlayingUrl = this.streamURLbuilder(this.playlist[this.playlistIndex], this.playbackBitrate)
      voiceConnection.play(nowPlayingUrl).pause(!this.progressPayload.isPaused)
      const paused = new Discord.MessageEmbed()
        .setColor(0xff0000)
        .setTitle('<:play_pause:757940598106882049> ' + 'Paused/Resumed.')
        .setTimestamp()
      message.channel.send(paused)
    }
  }

  async handleMessage (message: Discord.Message): Promise<Result> {
    if (this.jellyfinClient.isWebSocketOpen() === false) {
      this.openJellyfinWebsocket()
    }
    if (message.content.startsWith(discordPrefix)) {
      const intent = parseIntent(message.content)
      if (intent === undefined) {
        return {
          status: 'failure',
          message: `Failed to understand the command: ${message.content}`
        }
      }

      switch (intent) {
        case 'summon': {
          this.connect(message)
          break
        }
        case 'disconnect': {
          this.disconnect()
          break
        }
        case 'pause': {
          this.pause(message)
          break
        }
        case 'resume': {
          this.pause(message)
          break
        }
        case 'play': {
          if (this.user?.client.voice?.connections.size === 0) {
            this.connect(message)
            const queryString = message.content
              .split(`${discordPrefix}play`)
              .filter((_, i) => i > 0)
              .join('')
            const types = parsePlaySubcommand(queryString)
            const searchResults = await this.search(queryString, types)
            if (searchResults.SearchHints.length > 0) {
              this.add([searchResults.SearchHints[0].Id])
            }
          }

          // this.play(message)
          break
        }

        case 'stop': {
          this.currentlyPlaying = false
          this.voice?.connections.clear()
          break
        }

        /**
         * This branch is scuffed as hell - need to rebuild this later
         */
        // case 'seek': {
        //   const re = /(([0-9]+\:)+[0-9]{2})+|[0-9]+/;
        //   await this.updatePlaybackPayload()
        //   const matches = playtimeToSeconds(message.content.match(re)?.filter((_,i) => i === 0)[0] ?? "0") ?? this.progressPayload.positionTicks
        //   const seekPosition = matches?.length > 0 ? matches[0]
        //   const indexOfArgument = message.content.indexOf(discordPrefix + 'seek') + (discordPrefix + 'seek').length + 1
        //   const argument = message.content.slice(indexOfArgument)
        //   try {
        //     this.jellyfinClient.
        //     playbackmanager.seek(hmsToSeconds(argument) * 10000000)
        //   } catch (error) {
        //     const errorMessage = getDiscordEmbedError(error)
        //     message.channel.send(errorMessage)
        //   }
        //   break
        // }

        case 'skip': {
          if (this.currentlyPlaying && this.playlist.length > 1) {
            await this.updatePlaybackPayload()
            this.jellyfinClient.reportPlaybackStopped(this.progressPayload)
          }
          break
        }

        case 'help': {
          /* eslint-disable quotes */
          const reply = new Discord.MessageEmbed()
            .setColor(randomColour())
            .setTitle("<:musical_note:757938541123862638> " + "Jellyfin Discord Music Bot" + " <:musical_note:757938541123862638> ")
            .addFields({
              name: `${discordPrefix}summon`,
              value: "Join the channel the author of the message"
            }, {
              name: `${discordPrefix}disconnect`,
              value: "Disconnect from all current Voice Channels"
            }, {
              name: `${discordPrefix}play`,
              value: "Play the following item"
            }, {
              name: `${discordPrefix}add`,
              value: "Add the following item to the current playlist"
            }, {
              name: `${discordPrefix}pause/resume`,
              value: "Pause/Resume audio"
            }, {
              name: `${discordPrefix}seek`,
              value: "Where to Seek to in seconds or MM:SS"
            }, {
              name: `${discordPrefix}skip`,
              value: "Skip this Song"
            }, {
              name: `${discordPrefix}spawn`,
              value: "Spawns an Interactive Play Controller"
            }, {
              name: `${discordPrefix}help`,
              value: "Display this help message"
            }, {
              name: `GitHub`,
              value: "Find the code for this bot at: https://github.com/jayrovacsek/jellyfin-discord-music-bot"
            })
          message.channel.send(reply)
          break
        }
        default:
          break
      }
    }

    return {
      status: 'failure'
    }
  }
}

export const client = () => new Client()
