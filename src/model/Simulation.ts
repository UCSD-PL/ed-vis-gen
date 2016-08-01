import {Point, map4Tup, toMap, zip} from '../util/Util'
import {triggerMD, triggerMU, triggerMM} from './Events'
import {ICanvas} from 'fabric'
import {Image} from './Shapes'
import {Primitive, Variable} from './Variable'
import {drawShape} from '../view/Shapes'

// Functions for displaying and simulating interactions.

// given a work function, a length of time (in milliseconds), and a resolution, space the function's calls
// equally over the resolution. the function will receive the current resolution step
// as an argument. if shouldStop is true, the function will stop being called after
// resolution steps, and will invoke done.

function scheduleCalls(work: (n: number) => void, time: number, resolution: number, done: () => void, shouldStop: boolean): number {
  let i = 0
  let calls = setInterval( () =>  {
    // console.log('working outer')
    requestAnimationFrame(() => {
      work(i)
      // console.log('working inner')
      ++i
    })
    if (shouldStop && i > resolution) {
      clearInterval(calls)
      done()
    }
  }, time/resolution
  )

  return calls
}



// given a center point and a receiver for events, click on the center and draw a circle.

export function circularSim(center: Point, receiver: ICanvas) {
    let circResolution = 25
    let circDuration = 1000
    let r = 25
    let deltaX = 0 // offset.left
    let deltaY = 0 // offset.top
    let cdelta = 20

    let [cx, cy, cdx, cdy] = map4Tup(
      ["cx", "cy", "cdx", "cdy"],
      v => new Primitive(v)
    )

    let cStore = toMap(zip([cx, cy, cdx, cdy], [center.x + cdelta/2 - 6, center.y + cdelta/2 + 5, cdelta, cdelta]))

    // let imgSrc = 'https://3.bp.blogspot.com/-AjVCqXvl25E/U3XUGxQ4zmI/AAAAAAAAAds/MNDt3MLS-2w/s1600/curser.png'
    // let img = document.createElement('img')
    // img.src = imgSrc
    // img.id = 'mouse'
    // document.head.appendChild(img)
    let cursor = new Image(cx, cy, cdx, cdy, "mouse", 'black')
    let ctx = receiver.getContext()

    let startPoint = {x: center.x + deltaX, y: center.y + deltaY, r: r}
    // console.log(center)
    triggerMD(receiver, startPoint)

    drawShape(ctx, cursor, cStore)

    return scheduleCalls( (i) => {
      let theta = i*Math.PI * 2/circResolution
      let p = {
         x: startPoint.x + startPoint.r * Math.sin(theta),
         y: startPoint.y + startPoint.r * Math.cos(theta)
      }
       triggerMM(receiver, p)
      //  cursor.x = p.x - deltaX + cdelta/2 - 5;
      //  cursor.y = p.y - deltaY + cdelta/2 - 2;
       cStore.set(cx, p.x - deltaX + cdelta/2 - 6).set(cy, p.y - deltaY + cdelta/2 + 5)
       drawShape(ctx, cursor, cStore)
     }, circDuration, circResolution, () => null, false
    )
}
