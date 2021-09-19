
export const discordToken = process.env.DISCORD_TOKEN ?? ''
export const discordPrefix = process.env.DISCORD_PREFIX ?? '!'
export const jellyfinServerAddress = process.env.JELLYFIN_SERVER_ADDRESS ?? ''
export const jellyfinUsername = process.env.JELLYFIN_USERNAME ?? ''
export const jellyfinPassword = process.env.JELLYFIN_PASSWORD ?? ''
export const jellyfinAppName = process.env.JELLYFIN_APP_NAME ?? ''
export const interactiveSeekBarInterval = parseInt(process.env.MESSAGE_UPDATE_INTERVAL) ?? 2000
export const logLevel = process.env.LOG_LEVEL ?? 'info'
