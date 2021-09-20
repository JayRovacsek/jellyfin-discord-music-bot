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

const isSummendByPlay: boolean = false

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

const search = (target: string) => {
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

const play = async (message: Discord.Message) => {
  const indexOfItemID = message.content.indexOf(discordPrefix + 'play') + (discordPrefix + 'play').length + 1
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

async function addThis (message: Discord.Message) {
  const indexOfItemID = message.content.indexOf(discordPrefix + 'add') + (discordPrefix + 'add').length + 1
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

export const MessageHandler = {
  randomNumber,
  randomColour,
  searchForItemID

}
