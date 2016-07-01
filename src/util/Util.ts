
// immutable utility functions for sets and maps
// underlying objects are not deep-copied

// add an object to a set and return the result
export function add<T>(s: Set<T>, t: T): Set<T> {
  let ret = new Set<T>()
  s.forEach(e => ret.add(e))
  ret.add(t)
  return ret
}

// union two sets together and returns the result
export function union<T, U>(l: Set<T>, r: Set<U>): Set<T | U> {
  let ret = new Set<T | U>()
  // console.log(l)
  // console.log(r)
  l.forEach(e => ret.add(e))
  r.forEach(e => ret.add(e))
  return ret
}

// intersect two sets together and returns the result
export function intersect<T>(l: Set<T>, r: Set<T>): Set<T> {
  let ret = new Set<T>()
  // console.log(l)
  // console.log(r)
  l.forEach(e => {
    if (r.has(e)) ret.add(e)
  })
  return ret
}

// convert a set of tuples to a map
export function toMap<K, V>(tups: Set<[K,V]>): Map<K, V> {
  let ret = new Map<K, V>()
  tups.forEach(([k, v]) => ret.set(k, v))
  return ret
}

// tuple lifters, mainly for clean let-bindings
// e.g. let [a, b, c] = [x, y, z].map(...)
export function map3Tup<U, V>(tup: [U, U, U], f: (u: U) => V): [V, V, V] {
  return tup.map(f) as [V, V, V]
}
export function map4Tup<U, V>(tup: [U, U, U, U], f: (u: U) => V): [V, V, V, V] {
  return tup.map(f) as [V, V, V, V]
}

// partition maps/sets
export function partSet<U>(vals: Set<U>, f: (u: U) => boolean): [Set<U>, Set<U>] {
  let [trus, flses] = [new Set<U>(), new Set<U>()]

  for (let v of vals) {
    if (f(v))
      trus.add(v)
    else
      flses.add(v)
  }

  return [trus, flses]
}

export function partMap<K, V>(mp: Map<K, V>, f: (kv: [K, V]) => boolean): [Map<K, V>, Map<K, V>] {
  // I would convert the map to tuples, call partSet, and convert the result back to a map,
  // but then I'd be walking mp three times (when I only need to do it once).
  // JS needs map/fold fusion.

  let [trus, flses] = [new Map<K, V>(), new Map<K, V>()]

  for (let [k, v] of mp) {
    if (f([k, v]))
      trus.set(k, v)
    else
      flses.set(k, v)
  }

  return [trus, flses]
}

export function filter<U>(vals: Set<U>, f: (u: U) => boolean): Set<U> {
  let [ret, _] = partSet(vals, f)
  return ret
}

export function map<A, R>(vals: Set<A>, f: (a: A) => R): Set<R> {
  let ret = new Set<R>()
  for (let v of vals)
    ret.add(f(v))
  return ret
}

export function flatMap<A, R>(vals: Set<A>, f: (a: A) => Set<R>) {
  let ret = new Set<R>()
  // console.log(vals)
  for (let v of vals)
    ret = union(ret, f(v))
  return ret
}

// copy the key-portion of a map. values are not copied.
export function copy<K, V>(vals: Map<K, V>): Map<K, V> {
  return partMap(vals, _ => true)[0]
}

// test if there exists an element v of vals s.t. f v is true
// it's implementable using filter, but this version uses less memory and is usually
// quicker.
export function exists<U>(vals: Iterable<U>, f: (u: U) => boolean): boolean {
  let ret = find(vals, f)
  if (ret)
    return true
  else
    return false
}

// TODO: maybe<U>
export function find<U>(vals: Iterable<U>, f: (u: U) => boolean): U {
  for (let v of vals) {
    if (f (v))
      return v
  }
  return null
}

// zip up two arrays into an array of tuples
// not sure what happens when arrays have different length... don't do it
export function zip<L, R>(ls: L[], rs: R[]): [L, R][] {
  let mapper = (x: L, i:number) => [x, rs[i]] as [L, R]
  return ls.map(mapper)
}

export var DEBUG = false
export type Point = {x: number, y: number}
export function overlap({x: lx, y:ly}: Point, {x: rx, y:ry}: Point, thresh?: number) {
  thresh = thresh || 100
  let [dx, dy] = [Math.abs(lx - rx), Math.abs(ly - ry)]
  return (dx*dx + dy*dy) <= thresh
}

export type Tup<L, R> = [L, R]

export function assert(e: any, message?: string) {
  if (!e) {
    message = message || ""
    console.log('ASSERTION FAILED: ' + message)
    console.log(e)
    throw new Error()
  }
}
