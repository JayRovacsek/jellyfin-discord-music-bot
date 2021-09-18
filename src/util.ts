import * as Discord from 'discord.js'

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
    .map(value => parseInt(value))
    .reduce((value, acc, index) => {
      switch (index) {
        case 0: return (hour * value) + acc
        case 1: return (minute * value) + acc
        default:
          return value + acc
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
    .reduce((value, acc, index) => `${value}${index > 0 ? ':' : ''}${acc}`, '')

export const getDiscordEmbedError = (error: string): Discord.MessageEmbed => {
  return new Discord.MessageEmbed()
    .setColor(0xff0000)
    .setTitle('Error!')
    .setTimestamp()
    .setDescription(`<:x:757935515445231651> ${error}`)
}
