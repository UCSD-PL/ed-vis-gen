import {sendGet} from '../util/HTTP'

let currentID = -1

export function startSession(inp: string) {
  currentID = parseInt(inp)
  // send a session start request, set currentID to the response
  const handler = (response: string) => {
    // do nothing
    return 0
  }
  sendGet('start/' + currentID.toString(), handler)
}

export function endSession() {
  // send a session end request, clear current ID
  if (currentID != -1) {
    sendGet('endSession/' + currentID.toString(), (s: string) => 0)
  } else {
    console.log('error: end sessions called before currentID is set')
  }
}
