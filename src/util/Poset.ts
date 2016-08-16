// super simple partially ordered set collection. supports adding elements,
// removing elements, and for...of iteration.

import {map} from './Util'

export type Ranker<A> = (i: A) => number
export class Poset<A> implements Iterable<A>{
  private vals: Map<number, Set<A>>

  public constructor(seeds: Iterable<A>, private ranker: Ranker<A>, public defaultValue: A){
    this.vals = new Map<number, Set<A>>()

    for (let v of seeds)
      this.add(v)
  }
  public add(a: A): Poset<A> {
    let key = this.ranker(a)
    if (this.vals.has(key)) {
      this.vals.get(key).add(a)
    } else {
      this.vals.set(key, (new Set<A>()).add(a))
    }
    return this
  }
  public clear() {
    this.vals.clear()
  }
  public delete(a: A): boolean {
    let key = this.ranker(a)
    if (this.vals.has(key)) {
      return this.vals.get(key).delete(a)
    } else {
      return false
    }
  }

  public toArr(): A[] {
    return [... this]
  }


  //
  public debug<B>(f: (a: Set<A>) => B) {
    console.log("[")
    for (let [k, v] of this.vals) {
      console.log(k.toString() + " -> " + f(v).toString() + ",")
    }
    console.log(']')
  }


  public [Symbol.iterator]() {
    let vals = [... this.vals.entries()].sort((l, r) => l[0] - r[0])
    let me = this
    let ret = function* () {
      if (vals.length == 0) {
        yield me.defaultValue
      }
      for (let [_, retVals] of vals) {
        for (let rv of retVals) {
          yield rv
        }
      }
    }
    return ret()
  }

}
