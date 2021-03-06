declare module "cassowary" {

  interface VarArgType {
    name?: string
    value?: number
  }
  export class Variable {
    // new (opts: VarArgType) : Variable
    name:string
    value: number
    constructor(opts: VarArgType)
  }
  export class SimplexSolver {
    // new () : SimplexSolver
    addConstraint: (c: Constraint | Inequality) => SimplexSolver
    removeConstraint: (c: Constraint | Inequality) => SimplexSolver
    addEditVar: (v: Variable, s: Strength, w: number) => SimplexSolver
    beginEdit: () => void
    endEdit: () => void
    solve: () => void
    suggestValue: (v:Variable, c: number) => void
    constructor()
    public autoSolve: boolean
  }
  export enum Strength {weak, medium, strong, required}
  // export enum BinOp {GEQ, LEQ}
  export var GEQ: number
  export var LEQ: number
  export class Inequality {
    constructor(l:Expression, o:number, r:Expression)
  }
  export class Constraint {
    constructor(e:Expression, s:Strength, w:number)
  }
  export class Equation extends Constraint {
    constructor(l:Expression, r:Expression, s?: Strength)
  }
  export class Expression {
    static fromVariable: (v: Variable) => Expression
    static fromConstant: (c: number | Variable) => Expression
    plus: (that: Expression) => Expression
    times: (that: Expression | number) => Expression
    minus: (that: Expression) => Expression
    divide: (that: Expression | number) => Expression
    constant: number
  }
}
