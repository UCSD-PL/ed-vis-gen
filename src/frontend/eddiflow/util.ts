
module Eddiflow {
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
    _.each(cases, (tup:[matchT, retT]) => {
      if (matcher(tup[0], obj)) return tup[1];
    });

    // typescript has default argument types, but getting one to work for an alloc'd expr
    // is beyond my wizardry

    if (!notFoundError)
      throw new PatternMatchFailed("can't match " + obj.toString() + " to " + cases.toString());
    else
      throw notFoundError;

  }

}
