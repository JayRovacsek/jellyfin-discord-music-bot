/* eslint-disable no-undef */
import { LongIntent, parseIntent, ShortIntent } from '../discord'

describe('Discord function tests', () => {
  test('Should parse intent correctly', () => {
    const play = 'play'
    const playIntent = parseIntent(play)

    expect(playIntent).toEqual(ShortIntent.Play)
    expect(playIntent).toEqual(LongIntent.Play)

    const playExample = 'p my cool song!'
    const playIntentExample = parseIntent(playExample)

    expect(playIntentExample).toEqual(ShortIntent.Play)
    expect(playIntentExample).toEqual(LongIntent.Play)
  })
})
