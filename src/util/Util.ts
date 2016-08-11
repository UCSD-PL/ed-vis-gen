
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

// 'l is a subset of r iff all l' in l are in r'
export function subset<T>(l: Set<T>, r: Set<T>): boolean {
  return forall(l, t => r.has(t))
}
// 'l == r iff l <= r and r <= l'
export function seteq<T>(l: Set<T>, r: Set<T>): boolean {
  return subset(l, r) && subset(r, l)
}

// so, sets hash to their reference (i think), and not to their values.
// this is not ideal because then sets of sets are actually multisets:
// {1} != {1}, so {{1}, {1}} is valid.
// this hack uniqifies nested sets...gross but effective.
export function uniqify<T>(multi: Set<Set<T>>) : Set<Set<T>> {
  let ret = new Set<Set<T>>()

  // duplication check -- have we already found lhs in ret?
  let finder = (lhs: Set<T>) => (rhs: Set<T>) => seteq(lhs, rhs)

  for (let ss of multi) {
    if (exists(ret, finder(ss))) {
      // if there's a duplicate, *don't* add this set
    } else {
      ret.add(ss)
    }
  }
  return ret
}

export function* uniq<T>(elems: Iterable<T>): Iterable<T> {
  let seen = new Set<T>()
  for (let e of elems) {
    if (!(seen.has(e) || exists(seen, v => v == e))) {
      seen.add(e)
      yield e
    }
  }
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
export function toMap<K, V>(tups: Iterable<[K,V]>): Map<K, V> {
  let ret = new Map<K, V>()
  for (let [k, v] of tups) {
    ret.set(k, v)
  }
  return ret
}

// tuple lifters, mainly for clean let-bindings
// e.g. let [a, b, c] = [x, y, z].map(...)
export function map2Tup<U, V>(tup: [U, U], f: (u: U) => V): [V, V] {
  return tup.map(f) as [V, V]
}
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

export function* filter<U>(vals: Iterable<U>, f: (u: U) => boolean): Iterable<U> {
  for (let v of vals) {
    if (f(v)){
      yield v
    } else {
      continue
    }
  }
}


export function flatMap<A, R>(vals: Iterable<A>, f: (a: A) => Set<R>) {
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

// extend a map by one value
export function extend<K, V>(vals: Map<K, V>, [k, v]: Tup<K, V>): Map<K, V> {
  return copy(vals).set(k, v)
}

// invert a map
export function flip<K, V>(vals: Map<K, V>): Map<V, K> {
  let ret = new Map<V, K>()
  for (let [k, v] of vals) {
    ret.set(v, k)
  }
  return ret
}
// extend a map by entries in another map
export function extendMap<K, V>(lhs: Map<K, V>, rhs: Map<K, V>): Map<K, V> {
  let ret = copy(lhs)
  for (let [k, v] of rhs)
    ret.set(k, v)
  return ret
}

// map a function over a map
export function mapValues<K, A, R>(vals: Map<K, A>, f: (a: A) => R): Map<K, R> {
  let ret = new Map<K, R>()
  for (let [k, v] of vals) {
    ret.set(k, f(v))
  }
  return ret
}

// map a function over an iterable
export function* map<A, R>(vals: Iterable<A>, f: (a: A) => R): Iterable<R> {
  for (let v of vals)
    yield f(v)
}
// fold a function over an iterable
export function fold<A, B>(vals: Iterable<A>, f: (old: B, next: A) => B, init: B): B {
  let ret = init
  for (let next of vals) {
    ret = f(ret, next)
  }
  return ret
}

export function sum(vals: Iterable<number>) {
  return fold(vals, (sum, nxt) => sum + nxt, 0)
}

// concat two iterables
export function* cat<A> (l: Iterable<A>, r: Iterable<A>): Iterable<A> {
  for (let v of l)
    yield v
  for (let v of r)
    yield v
}



// test if there exists an element v of vals s.t. f v is true
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

// zip up two iterables into an iterable of tuples
// stop as soon as one iterable is done
// don't use on two infinite iterables...
export function* zip <L, R> (ls: Iterable<L>, rs: Iterable<R>):Iterable<Tup<L, R>> {
  let [li, ri] = [ls[Symbol.iterator](), rs[Symbol.iterator]()]
  let [lr, rr] = [li.next(), ri.next()]
  while(! (lr.done || rr.done)) {
    yield [lr.value, rr.value];
    [lr, rr] = [li.next(), ri.next()]
  }
}

// export function zip<L, R>(ls: Set<L>, rs: Set<R>): Set<Tup<L, R>> {
//
// }

// generator for an infinite stream
export function* repeat<A> (a: A) {
  while (true) {
    yield a
  }
}

export var DEBUG = false
export var DISPLAY_ID = 'physics'
export type Point = {x: number, y: number}
export function overlap({x: lx, y:ly}: Point, {x: rx, y:ry}: Point, thresh?: number) {
  thresh = thresh || 100
  let [dx, dy] = [Math.abs(lx - rx), Math.abs(ly - ry)]
  return (dx*dx + dy*dy) <= thresh
}

export type Tup<L, R> = [L, R]
export type Tup3<I> = [I, I, I]
export type Tup4<I> = [I, I, I, I]

export function assert(e: any, message?: string) {
  if (!e) {
    message = message || ""
    console.log('ASSERTION FAILED: ' + message)
    console.log(e)
    throw new Error()
  }
}

export function forall<U>(col: Iterable<U>, f: (u: U) => boolean) {
  for (let u of col) {
    if (!f(u))
      return false
  }
  return true
}

export function getNth<T>(col: Iterable<T>, index: number) {
  assert(index >= 0, 'expected nonzero index to getNth: ' + index.toString())

  let idx = index
  let iter = col[Symbol.iterator]()
  let res: IteratorResult<T>
  while (idx >= 0) {
    res = iter.next()
    idx--
    if (res.done && index >= 0) {
      console.log('invalid index ' + index.toString())
      console.log('for collection ')
      console.log(col)
    }
  }
  return res.value
}
