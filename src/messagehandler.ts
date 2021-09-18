import { discordPrefix } from './config'
import * as Discord from 'discord.js'
const {
  checkJellyfinItemIDRegex
} = require('./util')
const {
  hmsToSeconds,
  getDiscordEmbedError
} = require('./util')

const discordclientmanager = require('./discordclientmanager')
const jellyfinClientManager = require('./jellyfinclientmanager')
const playbackmanager = require('./playbackmanager')
const websocketHanler = require('./websockethandler')
const discordClient = discordclientmanager.getDiscordClient()

let isSummendByPlay: boolean = false

const randomNumber = (a: number, b: number): number =>
  Math.floor(Math.random() * (Math.max(a, b) - Math.min(a, b) + 1) + Math.min(a, b))

// random Color of the Jellyfin Logo Gradient
function randomColour () {
  const gradientStart = '#AA5CC3'
  const gradientEnd = '#00A4DC'

  const redStart = parseInt(gradientStart.slice(1, 3), 16)
  const greenStart = parseInt(gradientStart.slice(3, 5))
  const blueStart = parseInt(gradientStart.slice(5, 7))

  const redEnd = parseInt(gradientEnd.slice(1, 3), 16)
  const greenEnd = parseInt(gradientEnd.slice(3, 5))
  const blueEnd = parseInt(gradientEnd.slice(5, 7))

  const redValue = randomNumber(redStart, redEnd).toString(16)
  const greenValue = randomNumber(greenStart, greenEnd).toString(16)
  const blueValue = randomNumber(blueStart, blueEnd).toString(16)

  return `#${redValue}${greenValue}${blueValue}`
}

// Song Search, return the song itemID
async function searchForItemID (searchString) {
  const response = await jellyfinClientManager.getJellyfinClient().getSearchHints({
    searchTerm: searchString,
    includeItemTypes: 'Audio,MusicAlbum,Playlist'
  })

  if (response.TotalRecordCount < 1) {
    throw Error('Found nothing')
  } else {
    switch (response.SearchHints[0].Type) {
      case 'Audio':
        return [response.SearchHints[0].ItemId]
      case 'Playlist':
      case 'MusicAlbum': {
        const resp = await jellyfinClientManager.getJellyfinClient().getItems(jellyfinClientManager.getJellyfinClient().getCurrentUserId(), { sortBy: 'SortName', sortOrder: 'Ascending', parentId: response.SearchHints[0].ItemId })
        const itemArray = []
        resp.Items.forEach(element => {
          itemArray.push(element.Id)
        })
        return itemArray
      }
    }
  }
}

const summon = (voiceChannel: Discord.VoiceChannel) => voiceChannel.join()

const handleSummon = (message: Discord.Message): void => {
  if (message.channel.type === 'dm') {
    message.reply('Hi friend! I can\'t respond to direct messages, please summon me while in a voice channel')
  }

  if (message.member?.voice.channel === null) {
    message.reply('Please join a voice channel to summon me!')
  }

  if (message.member !== null && message.member.voice.channel !== null) {
    summon(message.member.voice.channel)
    const description = `<:loudspeaker:757929476993581117> **Joined Voice Channel** \`${message.member.voice.channel.name}\``
    const colour = randomColour()
    const vcJoin = new Discord.MessageEmbed()
      .setColor(colour)
      .setTitle('Joined Channel')
      .setTimestamp()
      .setDescription(description)

    message.channel.send(vcJoin)
  }
}

const play = async (message: string) => {
  const indexOfItemID = message.content.indexOf(CONFIG['discord-prefix'] + 'play') + (CONFIG['discord-prefix'] + 'play').length + 1
  const argument = message.content.slice(indexOfItemID)
  let items
  // check if play command was used with itemID
  const regexresults = checkJellyfinItemIDRegex(argument)
  if (regexresults) {
    items = regexresults
  } else {
    try {
      items = await searchForItemID(argument)
    } catch (e) {
      const noSong = getDiscordEmbedError(e)
      message.channel.send(noSong)
      playbackmanager.stop(isSummendByPlay ? discordClient.user.client.voice.connections.first() : undefined)
      return
    }
  }

  playbackmanager.startPlaying(discordClient.user.client.voice.connections.first(), items, 0, 0, isSummendByPlay)
  playbackmanager.spawnPlayMessage(message)
}

async function addThis (message) {
  const indexOfItemID = message.content.indexOf(CONFIG['discord-prefix'] + 'add') + (CONFIG['discord-prefix'] + 'add').length + 1
  const argument = message.content.slice(indexOfItemID)
  let items
  // check if play command was used with itemID
  const regexresults = checkJellyfinItemIDRegex(argument)
  if (regexresults) {
    items = regexresults
  } else {
    try {
      items = await searchForItemID(argument)
    } catch (e) {
      const noSong = getDiscordEmbedError(e)
      message.channel.send(noSong)
      return
    }
  }

  playbackmanager.addTracks(items)
}

export const handleMessage = (message: Discord.Message) => {
  if (message.content.startsWith(discordPrefix)) {
    if (message.content.startsWith(CONFIG['discord-prefix'] + 'summon')) {
      isSummendByPlay = false

      websocketHanler.openSocket()

      handleSummon(message)
    } else if (message.content.startsWith(CONFIG['discord-prefix'] + 'disconnect')) {
      playbackmanager.stop()
      jellyfinClientManager.getJellyfinClient().closeWebSocket()
      discordClient.user.client.voice.connections.forEach((element) => {
        element.disconnect()
      })
      let desc = '**Left Voice Channel** `'
      desc = desc.concat(message.member?.voice.channel?.name).concat('`')
      const vcJoin = new Discord.MessageEmbed()
        .setColor(getRandomDiscordColor())
        .setTitle('Left Channel')
        .setTimestamp()
        .setDescription('<:wave:757938481585586226> ' + desc)
      message.channel.send(vcJoin)
    } else if ((message.content.startsWith(CONFIG['discord-prefix'] + 'pause')) || (message.content.startsWith(CONFIG['discord-prefix'] + 'resume'))) {
      try {
        playbackmanager.playPause()
        const noPlay = new Discord.MessageEmbed()
          .setColor(0xff0000)
          .setTitle('<:play_pause:757940598106882049> ' + 'Paused/Resumed.')
          .setTimestamp()
        message.channel.send(noPlay)
      } catch (error) {
        const errorMessage = getDiscordEmbedError(error)
        message.channel.send(errorMessage)
      }
    } else if (message.content.startsWith(CONFIG['discord-prefix'] + 'play')) {
      if (discordClient.user.client.voice.connections.size < 1) {
        handleSummon(message)
        isSummendByPlay = true
      }

      play(message)
    } else if (message.content.startsWith(CONFIG['discord-prefix'] + 'stop')) {
      if (isSummendByPlay) {
        if (discordClient.user.client.voice.connections.size > 0) {
          playbackmanager.stop(discordClient.user.client.voice.connections.first())
        }
      } else {
        playbackmanager.stop()
      }
    } else if (message.content.startsWith(CONFIG['discord-prefix'] + 'seek')) {
      const indexOfArgument = message.content.indexOf(CONFIG['discord-prefix'] + 'seek') + (CONFIG['discord-prefix'] + 'seek').length + 1
      const argument = message.content.slice(indexOfArgument)
      try {
        playbackmanager.seek(hmsToSeconds(argument) * 10000000)
      } catch (error) {
        const errorMessage = getDiscordEmbedError(error)
        message.channel.send(errorMessage)
      }
    } else if (message.content.startsWith(CONFIG['discord-prefix'] + 'skip')) {
      try {
        playbackmanager.nextTrack()
      } catch (error) {
        const errorMessage = getDiscordEmbedError(error)
        message.channel.send(errorMessage)
      }
    } else if (message.content.startsWith(CONFIG['discord-prefix'] + 'add')) {
      addThis(message)
    } else if (message.content.startsWith(CONFIG['discord-prefix'] + 'spawn')) {
      try {
        playbackmanager.spawnPlayMessage(message)
      } catch (error) {
        const errorMessage = getDiscordEmbedError(error)
        message.channel.send(errorMessage)
      }
    } else if (message.content.startsWith(CONFIG['discord-prefix'] + 'help')) {
      /* eslint-disable quotes */
      const reply = new Discord.MessageEmbed()
        .setColor(getRandomDiscordColor())
        .setTitle("<:musical_note:757938541123862638> " + "Jellyfin Discord Music Bot" + " <:musical_note:757938541123862638> ")
        .addFields({
          name: `${CONFIG["discord-prefix"]}summon`,
          value: "Join the channel the author of the message"
        }, {
          name: `${CONFIG["discord-prefix"]}disconnect`,
          value: "Disconnect from all current Voice Channels"
        }, {
          name: `${CONFIG["discord-prefix"]}play`,
          value: "Play the following item"
        }, {
          name: `${CONFIG["discord-prefix"]}add`,
          value: "Add the following item to the current playlist"
        }, {
          name: `${CONFIG["discord-prefix"]}pause/resume`,
          value: "Pause/Resume audio"
        }, {
          name: `${CONFIG["discord-prefix"]}seek`,
          value: "Where to Seek to in seconds or MM:SS"
        }, {
          name: `${CONFIG["discord-prefix"]}skip`,
          value: "Skip this Song"
        }, {
          name: `${CONFIG["discord-prefix"]}spawn`,
          value: "Spawns an Interactive Play Controller"
        }, {
          name: `${CONFIG["discord-prefix"]}help`,
          value: "Display this help message"
        }, {
          name: `GitHub`,
          value: "Find the code for this bot at: https://github.com/KGT1/jellyfin-discord-music-bot"
        })
      message.channel.send(reply)
      /* eslint-enable quotes */
    }
  }
}
