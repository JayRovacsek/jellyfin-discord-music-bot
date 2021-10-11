import * as Discord from 'discord.js'
import { SearchableMedia } from './jellyfin/types'

const minute = 60
const hour = minute * 60

export const checkJellyfinItemIDRegex = (input: string): string | null => {
  const matches = input.match(/([0-9]|[a-f]){32}/)
  if (matches) {
    return matches[0]
  }
  return matches
}

export const ticksToSeconds = (ticks: number) => ticks / 10000000

/**
 *
 * @param playtime a string in the format: HH:MM:SS
 * @returns
 */
export const playtimeToSeconds = (playtime: string): number =>
  playtime
    .split(':')
    .reverse()
    .map(value => parseInt(value))
    .reduce((acc, value, index) => {
      switch (index) {
        case 0: return value + acc
        case 1: return (value * minute) + acc
        default:
          return (value * hour) + acc
      }
    }, 0)

/**
 *
 * @param seconds
 * @returns a string in the form of HH:MM:SS
 */
export const secondsToPlaytime = (seconds: number): string =>
  [hour, minute, 0]
    .map((value, index) => {
      switch (index) {
        case 0: return Math.floor(seconds / value)
        case 1: return Math.floor(seconds / value) % 60
        default:
          return seconds % 60
      }
    })
    .map(value => `${value}`.padStart(2, '0'))
    .reduce((acc, value, index) => `${acc}${index > 0 ? ':' : ''}${value}`, '')

export const getDiscordEmbedError = (error: string): Discord.MessageEmbed => {
  return new Discord.MessageEmbed()
    .setColor(0xff0000)
    .setTitle('Error!')
    .setTimestamp()
    .setDescription(`<:x:757935515445231651> ${error}`)
}

const randomNumber = (a: number, b: number): number =>
  Math.floor(Math.random() * (Math.max(a, b) - Math.min(a, b) + 1) + Math.min(a, b))

export const randomColour = () => {
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

export const parsePlaySubcommand = (message: string): string[] => {
  return SearchableMedia
    .filter(option => option.aliases
      .some(alias => message.includes(alias)))
    .map(option => option.searchTerm)
}
