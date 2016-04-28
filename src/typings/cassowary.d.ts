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
    addEditVar: (v: Variable, s: Strength, w: number) => SimplexSolver
    beginEdit: () => void
    endEdit: () => void
    suggestValue: (v:Variable, c: number) => void
    constructor()
  }
  export enum Strength {weak, medium, strong, required}
  export enum BinOp {GEQ, LEQ}
  export class Inequality {
    new (l:Expression, o:BinOp, r:Expression) : Inequality
  }
  export class Equation {
    new (l:Expression, r:Expression): Equation;
  }
  export class Constraint {
    new (e:Equation | Inequality, s:Strength, w:number) : Constraint
  }
  export class Expression {
    static fromVariable: (v: Variable) => Expression
    static fromConstant: (c: number) => Expression
  }
}
