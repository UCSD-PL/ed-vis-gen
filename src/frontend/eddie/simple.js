function init () {
    all_objects = [];
    drag_points = [];
    inc_objects = [];

    //VARIABLES:
    PW = makeVariable("PW", 15.0);
    LX1 = makeVariable("LX1", 250.0);
    PY = makeVariable("PY", 150.0);
    LY2 = makeVariable("LY2", 150.0);
    LY1 = makeVariable("LY1", 200.0);
    PH = makeVariable("PH", 8.0);
    BY = makeVariable("BY", 250.0);
    PX = makeVariable("PX", 250.0);
    LX2 = makeVariable("LX2", 250.0);
    BX = makeVariable("BX", 250.0);
    BH = makeVariable("BH", 50.0);
    BW = makeVariable("BW", 100.0);

    //IPOINTS:


    //SHAPES:
    S0 = Rectangle(BX.value-BW.value,
        BY.value-BH.value,
        BW.value+BX.value,
        BH.value+BY.value,
        "black",
        "rgba(0,0,0,0)");
        S1 = Line([LX1.value, LY1.value, LX2.value, LY2.value],
            "black",
            "rgba(0,0,0,0)");
    S2 = Rectangle(PX.value-PW.value,
        PY.value-PH.value,
        PW.value+PX.value,
        PH.value+PY.value,
        "black",
        "rgba(0,0,0,0)");

    init_stays(); // SUPER IMPORTANT NEED THIS CALL

    //EQUATIONS:
    addEquation(fromConst(0.0).plus(fromVar(LX1).times(1.0)),
        fromConst(0.0).plus(fromVar(BX).times(1.0)));
    addEquation(fromConst(0.0).plus(fromVar(LX2).times(1.0)),
        fromConst(0.0).plus(fromVar(PX).times(1.0)));
    addEquation(fromConst(0.0).plus(fromVar(LY1).times(1.0)),
        fromConst(0.0).plus(fromVar(BY).times(1.0).plus(fromVar(BH).times(-1.0))));
    addEquation(fromConst(0.0).plus(fromVar(LY2).times(1.0)),
        fromConst(0.0).plus(fromVar(PY).times(1.0)));

    push(all_objects, S0, S1, S2);
    push(drag_points);

    tau = Timer(20,
        function (t) {
            update_constraints();
                    global_redraw();
        },
        function () {
            resetCVs();
            update_constraints();
            global_redraw();
        });
}

function update_constraints () {
    S0.x1 = BX.value-BW.value;
    S0.y1 = BY.value-BH.value;
    S0.x2 = BW.value+BX.value;
    S0.y2 = BH.value+BY.value;
    S1.points = [LX1.value, LY1.value, LX2.value, LY2.value];
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

function on_release () {}

function on_click () {}
