/* eslint-disable no-undef */
import { secondsToPlaytime, playtimeToSeconds } from '../util'

describe('Utility function tests', () => {
  test('Should correctly generate the number of seconds in a playtime string', () => {
    const singleSecond = '00:00:01'
    const singleSecondToSeconds = playtimeToSeconds(singleSecond)

    expect(singleSecondToSeconds).toEqual(1)
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
  })
})
