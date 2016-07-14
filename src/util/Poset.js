// super simple partially ordered set collection. supports adding elements,
// removing elements, and for...of iteration.
"use strict";
class Poset {
    constructor(seeds, ranker) {
        this.ranker = ranker;
        this.vals = new Map();
        for (let v of seeds)
            this.add(v);
    }
    add(a) {
        let key = this.ranker(a);
        if (this.vals.has(key)) {
            this.vals.get(key).add(a);
        }
        else {
            this.vals.set(key, (new Set()).add(a));
        }
        return this;
    }
    clear() {
        this.vals.clear();
    }
    delete(a) {
        let key = this.ranker(a);
        if (this.vals.has(key)) {
            return this.vals.get(key).delete(a);
        }
        else {
            return false;
        }
    }
    [Symbol.iterator]() {
        let vals = [...this.vals.entries()].sort((l, r) => l[0] - r[0]);
        let ret = function* () {
            for (let [_, retVals] of vals) {
                for (let rv of retVals) {
                    yield rv;
                }
            }
        };
        return ret();
    }
}
exports.Poset = Poset;
