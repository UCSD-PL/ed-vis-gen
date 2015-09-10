function init () {
    all_objects = [];
    drag_points = [];
    inc_objects = [];

    //VARIABLES:
    LDY = makeVariable("LDY", -50.0);
    RDY = makeVariable("RDY", -50.0);
    LCX = makeVariable("LCX", 100.0);
    LDX = makeVariable("LDX", 50.0);
    RBRY = makeVariable("RBRY", 100.0);
    BY = makeVariable("BY", 200.0);
    LBRY = makeVariable("LBRY", 100.0);
    RBLX = makeVariable("RBLX", 200.0);
    LBLY = makeVariable("LBLY", 150.0);
    LTRX = makeVariable("LTRX", 100.0);
    LTRY = makeVariable("LTRY", 50.0);
    RBLY = makeVariable("RBLY", 150.0);
    RTLY = makeVariable("RTLY", 100.0);
    RTLX = makeVariable("RTLX", 150.0);
    LCY = makeVariable("LCY", 100.0);
    RDX = makeVariable("RDX", -50.0);
    RBRX = makeVariable("RBRX", 250.0);
    RCX = makeVariable("RCX", 200.0);
    BX = makeVariable("BX", 150.0);
    LTLX = makeVariable("LTLX", 50.0);
    LBRX = makeVariable("LBRX", 150.0);
    RCY = makeVariable("RCY", 100.0);
    RTRY = makeVariable("RTRY", 50.0);
    LBLX = makeVariable("LBLX", 100.0);
    BH = makeVariable("BH", 50.0);
    RTRX = makeVariable("RTRX", 200.0);
    LTLY = makeVariable("LTLY", 100.0);
    BW = makeVariable("BW", 50.0);

    //IPOINTS:


    //SHAPES:
    S0 = Triangle(LBRX.value,
        LBRY.value,
        LCX.value,
        LCY.value,
        LBLX.value,
        LBLY.value,
        "black",
        "rgba(0,0,0,0)");
    S1 = Triangle(RTRX.value,
        RTRY.value,
        RCX.value,
        RCY.value,
        RBRX.value,
        RBRY.value,
        "black",
        "rgba(0,0,0,0)");
    S2 = Triangle(RBRX.value,
        RBRY.value,
        RCX.value,
        RCY.value,
        RBLX.value,
        RBLY.value,
        "black",
        "rgba(0,0,0,0)");
    S3 = Triangle(RBLX.value,
        RBLY.value,
        RCX.value,
        RCY.value,
        RTLX.value,
        RTLY.value,
        "black",
        "rgba(0,0,0,0)");
    S4 = Triangle(RTLX.value,
        RTLY.value,
        RCX.value,
        RCY.value,
        RTRX.value,
        RTRY.value,
        "black",
        "rgba(0,0,0,0)");
    S5 = Triangle(LTLX.value,
        LTLY.value,
        LCX.value,
        LCY.value,
        LTRX.value,
        LTRY.value,
        "black",
        "rgba(0,0,0,0)");
    S6 = Rectangle(BX.value-BW.value,
        BY.value-BH.value,
        BW.value+BX.value,
        BH.value+BY.value,
        "black",
        "rgba(0,0,0,0)");
    S7 = Triangle(LBLX.value,
        LBLY.value,
        LCX.value,
        LCY.value,
        LTLX.value,
        LTLY.value,
        "black",
        "rgba(0,0,0,0)");
    S8 = Triangle(LTRX.value,
        LTRY.value,
        LCX.value,
        LCY.value,
        LBRX.value,
        LBRY.value,
        "black",
        "rgba(0,0,0,0)");

    init_stays(); // SUPER IMPORTANT NEED THIS CALL

    //EQUATIONS:
    addEquation(fromConst(0.0).plus(fromVar(LDX).times(1.0)),
        fromConst(0.0).plus(fromVar(LBRX).times(1.0).plus(fromVar(LBLX).times(-1.0))));
    addEquation(fromConst(0.0).plus(fromVar(RCX).times(1.0)),
        fromConst(0.0).plus(fromVar(RBLX).times(0.5).plus(fromVar(RTRX).times(0.5))));
    addEquation(fromConst(0.0).plus(fromVar(LCY).times(1.0)),
        fromConst(0.0).plus(fromVar(LTLY).times(0.5).plus(fromVar(LBRY).times(0.5))));
    addEquation(fromConst(0.0).plus(fromVar(LCX).times(1.0)),
        fromConst(0.0).plus(fromVar(LTLX).times(0.5).plus(fromVar(LBRX).times(0.5))));
    addEquation(fromConst(0.0).plus(fromVar(LBRX).times(1.0)),
        fromConst(0.0).plus(fromVar(RTLX).times(1.0)));
    addEquation(fromConst(0.0).plus(fromVar(RDX).times(1.0).plus(fromVar(LDX).times(-1.0))),
        fromConst(0.0).plus(fromVar(BW).times(-2.0)));
    addEquation(fromConst(0.0).plus(fromVar(LDY).times(1.0)),
        fromConst(0.0).plus(fromVar(LBRY).times(1.0).plus(fromVar(LBLY).times(-1.0))));
    addEquation(fromConst(0.0).plus(fromVar(LCX).times(1.0)),
        fromConst(0.0).plus(fromVar(LBLX).times(0.5).plus(fromVar(LTRX).times(0.5))));
    addEquation(fromConst(0.0).plus(fromVar(LTLY).times(1.0).plus(fromVar(LBLY).times(-1.0))),
        fromConst(0.0).plus(fromVar(LDX).times(-1.0)));
    addEquation(fromConst(0.0).plus(fromVar(LTLX).times(1.0).plus(fromVar(LBLX).times(-1.0))),
        fromConst(0.0).plus(fromVar(LDY).times(1.0)));
    addEquation(fromConst(0.0).plus(fromVar(LBLY).times(1.0)),
        fromConst(0.0).plus(fromVar(BY).times(1.0).plus(fromVar(BH).times(-1.0))));
    addEquation(fromConst(0.0).plus(fromVar(RBRY).times(1.0).plus(fromVar(RBLY).times(-1.0))),
        fromConst(0.0).plus(fromVar(RDX).times(1.0)));
    addEquation(fromConst(0.0).plus(fromVar(RCY).times(1.0)),
        fromConst(0.0).plus(fromVar(RBLY).times(0.5).plus(fromVar(RTRY).times(0.5))));
    addEquation(fromConst(0.0).plus(fromVar(RDX).times(1.0)),
        fromConst(0.0).plus(fromVar(RTLX).times(1.0).plus(fromVar(RBLX).times(-1.0))));
    addEquation(fromConst(0.0).plus(fromVar(BW).times(2.0)),
        fromConst(0.0).plus(fromVar(RBLX).times(1.0).plus(fromVar(LBLX).times(-1.0))));
    addEquation(fromConst(0.0).plus(fromVar(LBLX).times(1.0)),
        fromConst(0.0).plus(fromVar(BX).times(1.0).plus(fromVar(BW).times(-1.0))));
    addEquation(fromConst(0.0).plus(fromVar(RDY).times(1.0)),
        fromConst(0.0).plus(fromVar(RTLY).times(1.0).plus(fromVar(RBLY).times(-1.0))));
    addEquation(fromConst(0.0).plus(fromVar(LCY).times(1.0)),
        fromConst(0.0).plus(fromVar(LBLY).times(0.5).plus(fromVar(LTRY).times(0.5))));
    addEquation(fromConst(0.0).plus(fromVar(RCY).times(1.0)),
        fromConst(0.0).plus(fromVar(RTLY).times(0.5).plus(fromVar(RBRY).times(0.5))));
    addEquation(fromConst(0.0).plus(fromVar(RBLX).times(1.0)),
        fromConst(0.0).plus(fromVar(BW).times(1.0).plus(fromVar(BX).times(1.0))));
    addEquation(fromConst(0.0).plus(fromVar(RBLY).times(1.0)),
        fromConst(0.0).plus(fromVar(BY).times(1.0).plus(fromVar(BH).times(-1.0))));
    addEquation(fromConst(0.0).plus(fromVar(LBRY).times(1.0)),
        fromConst(0.0).plus(fromVar(RTLY).times(1.0)));
    addEquation(fromConst(0.0).plus(fromVar(RBRX).times(1.0).plus(fromVar(RBLX).times(-1.0))),
        fromConst(0.0).plus(fromVar(RDY).times(-1.0)));
    addEquation(fromConst(0.0).plus(fromVar(RCX).times(1.0)),
        fromConst(0.0).plus(fromVar(RTLX).times(0.5).plus(fromVar(RBRX).times(0.5))));

        IP = InteractionPoint(LBRX, LBRY);
        IP.links = ["LBRX", "LBRY", "LCX", "LCY", "LTRX", "LTRY",
                    "LTLX", "LTLY", "LDX", "LDY", "RTLX", "RTLY",
                    "RDX", "RDY", "RCX", "RCY", "RTRX", "RTRY",
                    "RBRX", "RBRY"];
                    push(all_objects, S1, S6, S0, S7, S3, S4, S8, S5, S2, IP);
                    push(drag_points, IP);

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
    S0.y3 = LBLY.value;
    S0.y2 = LCY.value;
    S0.x1 = LBRX.value;
    S0.x2 = LCX.value;
    S0.x3 = LBLX.value;
    S0.y1 = LBRY.value;
    S1.x3 = RBRX.value;
    S1.y1 = RTRY.value;
    S1.y2 = RCY.value;
    S1.y3 = RBRY.value;
    S1.x2 = RCX.value;
    S1.x1 = RTRX.value;
    S2.y3 = RBLY.value;
    S2.x1 = RBRX.value;
    S2.x3 = RBLX.value;
    S2.y1 = RBRY.value;
    S2.y2 = RCY.value;
    S2.x2 = RCX.value;
    S3.x2 = RCX.value;
    S3.y1 = RBLY.value;
    S3.x3 = RTLX.value;
    S3.x1 = RBLX.value;
    S3.y3 = RTLY.value;
    S3.y2 = RCY.value;
    S4.x1 = RTLX.value;
    S4.x2 = RCX.value;
    S4.x3 = RTRX.value;
    S4.y1 = RTLY.value;
    S4.y2 = RCY.value;
    S4.y3 = RTRY.value;
    S5.y1 = LTLY.value;
    S5.x3 = LTRX.value;
    S5.y2 = LCY.value;
    S5.y3 = LTRY.value;
    S5.x2 = LCX.value;
    S5.x1 = LTLX.value;
    S6.x1 = BX.value-BW.value;
    S6.y1 = BY.value-BH.value;
    S6.x2 = BW.value+BX.value;
    S6.y2 = BH.value+BY.value;
    S7.y1 = LBLY.value;
    S7.y3 = LTLY.value;
    S7.x3 = LTLX.value;
    S7.y2 = LCY.value;
    S7.x2 = LCX.value;
    S7.x1 = LBLX.value;
    S8.x3 = LBRX.value;
    S8.y2 = LCY.value;
    S8.x1 = LTRX.value;
    S8.x2 = LCX.value;
    S8.y1 = LTRY.value;
    S8.y3 = LBRY.value;
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
