"use strict";
// Timer primitive. Takes a frequency and body as arguments. Can be started,
// stopped, and reset. Assumes work takes a single (numeric) argument representing
// the current time.
class Timer {
    constructor(freq, work, done) {
        this.freq = freq;
        this.work = work;
        this.done = done;
        this.started = false;
        this.t = 0;
        this.start = () => {
            if (!this.started) {
                this.started = true;
                // oboy
                // we pass this as an argument to setInterval, so the handler receives
                // a Timer instance (i.e., this)
                this.myID = setInterval((me) => {
                    requestAnimationFrame(() => {
                        me.work(me.t);
                        me.t++;
                    });
                }, freq, this);
            }
        };
    }
    stop() {
        if (this.started) {
            this.started = false;
            clearInterval(this.myID);
        }
    }
    reset() {
        this.stop();
        this.shouldRun = false;
        this.t = 0;
        this.done();
    }
}
exports.Timer = Timer;
