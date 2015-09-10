function init () {
    all_objects = [];
    drag_points = [];
    inc_objects = [];

    //VARIABLES:
    LCX = makeVariable("LCX", 100.0);
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
    S2 = Triangle(LBLX.value,
        LBLY.value,
        LBRX.value,
        LBRY.value,
        RBLX.value,
        RBLY.value,
        "black",
        "rgba(0,0,0,0)");
    S3 = Triangle(RBRX.value,
        RBRY.value,
        RCX.value,
        RCY.value,
        RBLX.value,
        RBLY.value,
        "black",
        "rgba(0,0,0,0)");
    S4 = Triangle(RBLX.value,
        RBLY.value,
        RCX.value,
        RCY.value,
        RTLX.value,
        RTLY.value,
        "black",
        "rgba(0,0,0,0)");
    S5 = Triangle(RTLX.value,
        RTLY.value,
        RCX.value,
        RCY.value,
        RTRX.value,
        RTRY.value,
        "black",
        "rgba(0,0,0,0)");
    S6 = Triangle(LTLX.value,
        LTLY.value,
        LCX.value,
        LCY.value,
        LTRX.value,
        LTRY.value,
        "black",
        "rgba(0,0,0,0)");
    S7 = Rectangle(BX.value-BW.value,
        BY.value-BH.value,
        BW.value+BX.value,
        BH.value+BY.value,
        "black",
        "rgba(0,0,0,0)");
    S8 = Triangle(LBLX.value,
        LBLY.value,
        LCX.value,
        LCY.value,
        LTLX.value,
        LTLY.value,
        "black",
        "rgba(0,0,0,0)");
    S9 = Triangle(LTRX.value,
        LTRY.value,
        LCX.value,
        LCY.value,
        LBRX.value,
        LBRY.value,
        "black",
        "rgba(0,0,0,0)");

    init_stays(); // SUPER IMPORTANT NEED THIS CALL

    //EQUATIONS:
    addEquation(fromConst(0.0).plus(fromVar(BW).times(2.0)),
        fromConst(0.0).plus(fromVar(LBLX).times(-1.0).plus(fromVar(RBLX).times(1.0))));

    push(all_objects, S9, S1, S6, S0, S7, S3, S4, S8, S5, S2);
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
    S0.y3 = LBLY.value;
    S0.x2 = LCX.value;
    S0.y2 = LCY.value;
    S0.x1 = LBRX.value;
    S0.x3 = LBLX.value;
    S0.y1 = LBRY.value;
    S1.x2 = RCX.value;
    S1.x3 = RBRX.value;
    S1.y2 = RCY.value;
    S1.y1 = RTRY.value;
    S1.y3 = RBRY.value;
    S1.x1 = RTRX.value;
    S2.x2 = LBRX.value;
    S2.y2 = LBRY.value;
    S2.y3 = RBLY.value;
    S2.x1 = LBLX.value;
    S2.x3 = RBLX.value;
    S2.y1 = LBLY.value;
    S3.y1 = RBRY.value;
    S3.y2 = RCY.value;
    S3.y3 = RBLY.value;
    S3.x1 = RBRX.value;
    S3.x3 = RBLX.value;
    S3.x2 = RCX.value;
    S4.y2 = RCY.value;
    S4.y1 = RBLY.value;
    S4.y3 = RTLY.value;
    S4.x1 = RBLX.value;
    S4.x2 = RCX.value;
    S4.x3 = RTLX.value;
    S5.x1 = RTLX.value;
    S5.y2 = RCY.value;
    S5.x2 = RCX.value;
    S5.x3 = RTRX.value;
    S5.y3 = RTRY.value;
    S5.y1 = RTLY.value;
    S6.x2 = LCX.value;
    S6.x3 = LTRX.value;
    S6.y3 = LTRY.value;
    S6.x1 = LTLX.value;
    S6.y1 = LTLY.value;
    S6.y2 = LCY.value;
    S7.x1 = BX.value-BW.value;
    S7.y1 = BY.value-BH.value;
    S7.x2 = BW.value+BX.value;
    S7.y2 = BH.value+BY.value;
    S8.y1 = LBLY.value;
    S8.x2 = LCX.value;
    S8.y2 = LCY.value;
    S8.x1 = LBLX.value;
    S8.x3 = LTLX.value;
    S8.y3 = LTLY.value;
    S9.y3 = LBRY.value;
    S9.y1 = LTRY.value;
    S9.x2 = LCX.value;
    S9.x1 = LTRX.value;
    S9.y2 = LCY.value;
    S9.x3 = LBRX.value;
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
