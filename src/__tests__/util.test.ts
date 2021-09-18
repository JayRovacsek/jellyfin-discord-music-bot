/* eslint-disable no-undef */
import { secondsToPlaytime, playtimeToSeconds } from '../util'

describe('Utility function tests', () => {
  test('Should correctly generate the number of seconds in a playtime string', () => {
    const second = '00:00:01'
    const secondToSeconds = playtimeToSeconds(second)

    expect(secondToSeconds).toEqual(1)

    const minute = '00:01:00'
    const minuteToSeconds = playtimeToSeconds(minute)

    expect(minuteToSeconds).toEqual(60)

    const hour = '01:00:00'
    const hourToSeconds = playtimeToSeconds(hour)

    expect(hourToSeconds).toEqual(3600)

    const smallMix = '12:34:56'
    const smallMixToSeconds = playtimeToSeconds(smallMix)

    expect(smallMixToSeconds).toEqual(45296)

    const bigMix = '25:61:61'
    const bigMixToSeconds = playtimeToSeconds(bigMix)

    expect(bigMixToSeconds).toEqual(93721)
  })

  test('Should correctly generate a playtime string from a given number (seconds)', () => {
    const second = 1
    const secondToPlaytime = secondsToPlaytime(second)

    expect(secondToPlaytime).toEqual('00:00:01')

    const minute = 60
    const minuteToPlaytime = secondsToPlaytime(minute)

    expect(minuteToPlaytime).toEqual('00:01:00')

    const hour = minute * 60
    const hourToPlaytime = secondsToPlaytime(hour)

    expect(hourToPlaytime).toEqual('01:00:00')

    const smallMix = (hour * 10) + (minute * 34) + (second * 12)
    const smallMixToPlaytime = secondsToPlaytime(smallMix)

    expect(smallMixToPlaytime).toEqual('10:34:12')

    const bigMix = (hour * 256) + (minute * 62) + (second * 100)
    const bigMixToPlaytime = secondsToPlaytime(bigMix)

    expect(bigMixToPlaytime).toEqual('257:03:40')
  })
})
