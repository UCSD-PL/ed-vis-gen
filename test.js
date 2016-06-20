var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Unimplemented = (function (_super) {
    __extends(Unimplemented, _super);
    function Unimplemented(message) {
        this.message = message;
        this.name = "unimplemented";
        _super.call(this);
    }
    return Unimplemented;
}(Error));
var bop;
(function (bop) {
    bop[bop["Pls"] = 0] = "Pls";
    bop[bop["Min"] = 1] = "Min";
    bop[bop["Tim"] = 2] = "Tim";
    bop[bop["Div"] = 3] = "Div";
})(bop || (bop = {}));
var uop;
(function (uop) {
    uop[uop["Neg"] = 0] = "Neg";
})(uop || (uop = {}));
var BinOp = (function () {
    function BinOp(o, l, r) {
        this.op = o;
        this.lhs = l;
        this.rhs = r;
    }
    return BinOp;
}());
var UnOp = (function () {
    function UnOp(o, i) {
        this.op = o;
        this.inner = i;
    }
    return UnOp;
}());
var FunApp = (function () {
    function FunApp() {
        throw new Unimplemented("haven't done FunApp yet");
    }
    return FunApp;
}());
var texpr = new BinOp(bop.Pls, 1, 2);
