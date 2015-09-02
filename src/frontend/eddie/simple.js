function init () {
    all_objects = [];
    drag_points = [];
    inc_objects = [];
    //VARIABLES:
    CY = makeVariable("CY", 50.0);
    CX = makeVariable("CX", 50.0);
    RXPRW = makeVariable("RXPRW", 120.0);
    R = makeVariable("R", 20.0);
    RYMRH = makeVariable("RYMRH", 70.0);
    RH = makeVariable("RH", 30.0);
    RY = makeVariable("RY", 100.0);
    RX = makeVariable("RX", 100.0);
    RW = makeVariable("RW", 20.0);
    //IPOINTS:
    IP77 = InteractionPoint(
        RXPRW,
        RYMRH
    );
    IP77.links = ["CY", "CX", "RXPRW", "RYMRH", "RY", "RX"];
    //SHAPES:
    S0 = Circle(
        CX.value,
        CY.value,
        R.value,
        "black",
        "rgba(0,0,0,0)"
    );
    S1 = Rectangle(
        RX.value-RW.value,
        RY.value-RH.value,
        RW.value+RX.value,
        RH.value+RY.value,
        "black",
        "rgba(0,0,0,0)"
    );
    init_stays(); // SUPER IMPORTANT NEED THIS CALL
    //EQUATIONS:
    addEquation(fromConst(0.0).plus(fromVar(CX).times(1.0)),
        fromConst(-50.0).plus(fromVar(RX).times(1.0)));
    addEquation(fromConst(0.0).plus(fromVar(CY).times(1.0)),
        fromConst(-50.0).plus(fromVar(RY).times(1.0)));
    addEquation(fromConst(0.0).plus(fromVar(RXPRW).times(1.0)),
        fromConst(0.0).plus(fromVar(RW).times(1.0).plus(fromVar(RX).times(1.0))));
    addEquation(fromConst(0.0).plus(fromVar(RYMRH).times(1.0)),
        fromConst(0.0).plus(fromVar(RY).times(1.0).plus(fromVar(RH).times(-1.0))));
    push(all_objects, S0, S1, IP77);
    push(drag_points, IP77);
    tau = Timer(
        20,
        function  (t) {
            update_constraints();
            global_redraw();
        },
        function  () {
            update_constraints();
            global_redraw();
        }
    );
}
function update_constraints () {
    S0.x = CX.value; S0.y = CY.value; S0.r = R.value;
    S1.x1 = RX.value-RW.value;
    S1.y1 = RY.value-RH.value;
    S1.x2 = RW.value+RX.value;
    S1.y2 = RH.value+RY.value;
}
function drag_update () {
    update_constraints();
}
function start () {
    tau.start();
}
function stop () {
    tau.stop();
}
function reset () {
    tau.reset();
}
function on_release () {

}
function on_click () {

}
