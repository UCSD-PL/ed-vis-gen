



module Eddiflow {
  export interface Map<T> {
    [K: string]: T;
  }

  export function filterMap<T> (m: Map<T>, filtee: (k: string, v: T) => boolean): Map<T> {
    let ret: Map<T> = {};
    for (var key in m) {
      if (filtee(key, m[key]))
        ret[key] = m[key];
    }

    return ret;
  }
  export class Unimplemented extends Error {
    constructor(message: string) {
      this.message = message;
      this.name = "unimplemented";
      super();
    }
  }

  export class BadExprFormat extends Error {
    constructor(message: string) {
      this.message = message;
      this.name = "Bad Expression Format";
      super();
    }
  }

  class PatternMatchFailed extends Error {
    constructor(message: string) {
      this.message = message;
      this.name = "Inexaustive pattern match";
      super();
    }
  }

  export function match<matchT, retT, errT extends Error>(
    obj: matchT,
    matcher: (l: matchT, r: matchT) => boolean,
    cases: [matchT, retT][],
    notFoundError?: errT
  ): retT {
    let res: [matchT, retT] = _.find(cases, (tup:[matchT, retT]) => {
      console.log("matching " + tup[0].toString() + " vs " + obj.toString());
      return matcher(obj, tup[0]);
    });

    if (res !== undefined) {
      return res[1];
    }

    // typescript has default argument types, but getting one to work for an alloc'd expr
    // is beyond my wizardry

    if (!notFoundError)
      throw new PatternMatchFailed("can't match " + obj.toString() + " to " + cases.toString());
    else
      throw notFoundError;

  }

}
