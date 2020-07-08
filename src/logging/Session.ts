import {sendGet} from '../util/HTTP'


export function startSession() {
  const id = prompt("Session ID?")
  const benchmark = prompt("Benchmark?")
  // send a session start request, set currentID to the response
  const handler = (response: string) => {
    // do nothing
    return 0
  }
  sendGet('start/' + id + "/" + benchmark, handler)
}

export function endSession() {
  // send a session end request, clear current ID
  const id = prompt("Session ID?")
  const benchmark = prompt("Benchmark?")
  sendGet('endSession/' + id + "/" + benchmark, (s: string) => 0)
}
