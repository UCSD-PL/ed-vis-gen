
// Timer primitive. Takes a frequency and body as arguments. Can be started,
// stopped, and reset. Assumes work takes a single (numeric) argument representing
// the current time.
export class Timer {
  private t: number
  private myID: number
  public started: boolean
  public shouldRun: boolean
  public start: () => void
  public stop() {
    if (this.started) {
      this.started = false
      clearInterval(this.myID)
    }
  }
  public reset() {
    this.stop()
    this.shouldRun = false
    this.t = 0
    this.done()
  }


  public constructor(
    public freq:number,
    public work: (n: number) => void,
    public done: () => void
  ) {
    this.started = false
    this.t = 0
    this.start = () => {
      if (! this.started) {
        this.started = true
        // oboy
        // we pass this as an argument to setInterval, so the handler receives
        // a Timer instance (i.e., this)
        this.myID = setInterval( (me: Timer) => {
          requestAnimationFrame( () => {
            me.work(me.t)
            me.t++
          }
        )}, freq, this)
      }
    }
  }
}
