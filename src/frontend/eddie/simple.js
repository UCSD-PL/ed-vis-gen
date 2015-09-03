//prog20
function init () {
    all_objects = [];
    drag_points = [];
    inc_objects = [];
    //VARIABLES:
    PW = makeVariable("PW", 20.0);
    PX_IX = makeVariable("PX_IX", 250.0);
    PY = makeVariable("PY", 150.0);
    SY = makeVariable("SY", 200.0);
    SX = makeVariable("SX", 250.0);
    PH = makeVariable("PH", 10.0);
    BY = makeVariable("BY", 250.0);
    PX = makeVariable("PX", 250.0);
    DX = makeVariable("DX", 0.0);
    BX = makeVariable("BX", 250.0);
    PY_IY = makeVariable("PY_IY", 150.0);
    BH = makeVariable("BH", 50.0);
    DY = makeVariable("DY", -50.0);
    BW = makeVariable("BW", 100.0);
    //IPOINTS:
    IP20 = InteractionPoint(
        PX_IX,
        PY_IY
    );
    IP20.links = ["PY_IY", "PY", "DY"];
    //SHAPES:
    S0 = Rectangle(
        BX.value-BW.value,
        BY.value-BH.value,
        BW.value+BX.value,
        BH.value+BY.value,
        "black",
        "rgba(0,0,0,0)"
    );
    S1 = Spring(
        SX.value,
        SY.value,
        DX.value,
        DY.value,
        "black",
        "rgba(0,0,0,0)"
    );
    S2 = Rectangle(
        PX.value-PW.value,
        PY.value-PH.value,
        PW.value+PX.value,
        PH.value+PY.value,
        "black",
        "rgba(0,0,0,0)"
    );
    init_stays(); // SUPER IMPORTANT NEED THIS CALL
    //EQUATIONS:
    addEquation(fromConst(0.0).plus(fromVar(SY).times(1.0)),
        fromConst(0.0).plus(fromVar(BY).times(1.0).plus(fromVar(BH).times(-1.0))));
    addEquation(fromConst(0.0).plus(fromVar(SX).times(1.0)),
        fromConst(0.0).plus(fromVar(BX).times(1.0)));
    addEquation(fromConst(0.0).plus(fromVar(PY).times(1.0)),
        fromConst(0.0).plus(fromVar(SY).times(1.0).plus(fromVar(DY).times(1.0))));
    addEquation(fromConst(0.0).plus(fromVar(PX_IX).times(1.0)),
        fromConst(0.0).plus(fromVar(PX).times(1.0)));
    addEquation(fromConst(0.0).plus(fromVar(PX).times(1.0)),
        fromConst(0.0).plus(fromVar(SX).times(1.0).plus(fromVar(DX).times(1.0))));
    addEquation(fromConst(0.0).plus(fromVar(PY_IY).times(1.0)),
        fromConst(0.0).plus(fromVar(PY).times(1.0)));
    push(all_objects, S0, S1, S2, IP20);
    push(drag_points, IP20);
    tau = Timer(
        20,
        function  (t) {
            update_constraints();
            global_redraw();
        },
        function  () {
            resetCVs();
            update_constraints();
            global_redraw();
        }
    );
}
function update_constraints () {
    S0.x1 = BX.value-BW.value;
    S0.y1 = BY.value-BH.value;
    S0.x2 = BW.value+BX.value;
    S0.y2 = BH.value+BY.value;
    S1.x = SX.value; S1.y = SY.value; S1.dx = DX.value; S1.dy = DY.value;
    S2.x1 = PX.value-PW.value;
    S2.y1 = PY.value-PH.value;
    S2.x2 = PW.value+PX.value;
    S2.y2 = PH.value+PY.value;
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
