
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
  l.forEach(e => ret.add(e))
  r.forEach(e => ret.add(e))
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

// copy the key-portion of a map. values are not copied.
export function copy<K, V>(vals: Map<K, V>): Map<K, V> {
  return partMap(vals, _ => true)[0]
}

// test if there exists an element v of vals s.t. f v is true
// it's implementable using filter, but this version uses less memory and is usually
// quicker.
export function exists<U>(vals: Iterable<U>, f: (u: U) => boolean): boolean {
  for (let v of vals) {
    if (f (v))
      return true
  }
  return false
}

export var DEBUG = false
export type Point = {x: number, y: number}
