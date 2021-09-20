
const { ApiClient, Events } = require('jellyfin-apiclient')
import { jellyfinServerAddress, jellyfinAppName } from './config'
const os = require('os')

var jellyfinClient

function init () {
  jellyfinClient = new ApiClient(jellyfinServerAddress, jellyfinAppName, '0.0.2', os.hostname(), os.hostname())
}

function getJellyfinClient () {
  return jellyfinClient
}

function getJellyfinEvents () {
  return Events
}

module.exports = {
  getJellyfinClient,
  getJellyfinEvents,
  init
}
