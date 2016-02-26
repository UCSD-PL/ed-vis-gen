/// <reference path="util.ts"/>

module Eddiflow {
  // expression AST for dataflow expressions
  // standard expression grammar
  // expr ::= binop | unop | app | primitive | var
  export type expr =
    BinOp | UnOp | FunApp | number | Var

  // enums for binary operators, unary operators
  export enum bop {Pls, Min, Tim, Div}
  export enum uop {Neg}
  // binary operator AST
  export class BinOp {
    op: bop;
    lhs: expr;
    rhs: expr;
    constructor(o: bop, l: expr, r: expr) {
      this.op = o; this.lhs = l; this.rhs = r;
    }
  }
  // unary operator AST
  export class UnOp {
    op: uop;
    inner: expr;
    constructor(o: uop, i: expr) {
      this.op = o; this.inner = i;
    }
  }
  // function application AST
  export class FunApp {
    // TODO
    constructor(){
      throw new Unimplemented("haven't done FunApp yet");
    }
  }

  // variable wrapper. for now, just hold a string (the variable's name/ID).
  export class Var {
    ref: string
    constructor(name:string) {
      this.ref = name;
    }
  }
}
