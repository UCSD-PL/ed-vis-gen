import {Point} from '../util/Util'
import {triggerMD, triggerMU, triggerMM} from './Events'
import {ICanvas} from 'fabric'

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


// given a callback, a circle, and a resolution, invoke the callback at equally
// spaced points along the circle. the callback is passed the x-y coordinates as
// an object.

// function circularInvoke(Κ, circ, resolution, i) {
//   var theta = i*Math.PI * 2/resolution;
//   var x = circ.x + circ.r * Math.cos(theta);
//   var y = circ.y + circ.r * Math.sin(theta);
//   Κ({x: x, y: y});
//
// }


// same as above, but for a line instead of a circle
// function lineInvoke(Κ, start, end, resolution, i) {
//   var dx = end.x - start.x;
//   var dy = end.y - start.y;
//   var x = start.x + dx/resolution*i;
//   var y = start.y + dy/resolution*i;
//   Κ({x: x, y: y});
// }

// given a center point and a receiver for events, click on the center,
// drag to the start of a circle, drag a circle, and release.

export function circularSim(center: Point, receiver: ICanvas) {
    let circResolution = 25
    let circDuration = 1000
    let r = 25
    let deltaX = 0 // offset.left
    let deltaY = 0 // offset.top
    let cdelta = 20
    // cursor = Image(point.x + cdelta/2-5, point.y + cdelta/2 -2, cdelta, cdelta, "mouse")

    let startPoint = {x: center.x + deltaX, y: center.y + deltaY, r: r}
    // console.log(center)
    triggerMD(receiver, startPoint)

    return scheduleCalls( (i) => {
      let theta = i*Math.PI * 2/circResolution
      let p = {
         x: startPoint.x + startPoint.r * Math.sin(theta),
         y: startPoint.y + startPoint.r * Math.cos(theta)
      }
       triggerMM(receiver, p)
     }, circDuration, circResolution, () => null, false
    )
}


// function circularSim(offset, point, receiver) {
//
//   var circResolution = 25;
//   var circDuration = 1000;
//   var r = 25;
//   var deltaX = 0; // offset.left
//   var deltaY = 0; // offset.top
//
//   var cdelta = 20;
//   cursor = Image(point.x + cdelta/2-5, point.y + cdelta/2 -2, cdelta, cdelta, "mouse"); // height, width
//   all_objects.push(cursor);
//
//   var newPoint = {x: point.x + deltaX, y: point.y + deltaY};
//   dispatchEvent(receiver, generateMD(newPoint)); // click on the point
//
//
//   return scheduleCalls(function (i) {
//     circularInvoke( function(p) {
//           cursor.x = p.x - deltaX + cdelta/2 - 5;
//           cursor.y = p.y - deltaY + cdelta/2 - 2;
//           dispatchEvent(receiver, generateMM(p)); // drag around the circle
//         },
//         {x: newPoint.x, y: newPoint.y, r: r},
//         circResolution,
//         i
//       );
//     }, circDuration, circResolution, function() {}, false
//   );
//
// }
