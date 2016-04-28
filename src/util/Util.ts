
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
export function union<T>(l: Set<T>, r: Set<T>): Set<T> {
  let ret = new Set<T>()
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
