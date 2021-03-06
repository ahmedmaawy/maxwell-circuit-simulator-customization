let CircuitComponent = require('./CircuitComponent');

let Polygon = require('../geom/Polygon');
let Rectangle = require('../geom/Rectangle');
let Point = require('../geom/Point');
let Util = require('../util/Util');

class TransistorElm extends CircuitComponent {
  static get Fields() {
    return {
      "pnp": {
        title: "Polarity",
        description: "Current multiplier",
        default_value: -1,
        data_type: Math.sign,
        field_type: "select",
        select_values: {"NPN": -1, "PNP": 1}
      },
      "lastvbe": {
        title: "Initial VBE",
        unit: "Voltage",
        symbol: "V",
        default_value: 0,
        data_type: parseFloat,
        type: "physical"
      },
      "lastvbc": {
        title: "Initial VBC",
        unit: "Voltage",
        symbol: "V",
        default_value: 0,
        data_type: parseFloat
      },
      "beta": {
        title: "Beta",
        description: "Current gain",
        default_value: 100,
        data_type: parseFloat,
        range: [0, Infinity]
      }
    }
  }

  constructor(xa, ya, xb, yb, params, f) {
    super(xa, ya, xb, yb, params, f);

    this.rect = []; // Array of points
    this.coll = []; // Array of points
    this.emit = []; // Array of points
    this.base = new Point(0, 0); // Single point
    this.gmin = 0;
    this.ie = 0;
    this.ic = 0;
    this.ib = 0;

    // this.curcount_c = 0
    // this.curcount_e = 0
    // this.curcount_b = 0

    this.rectPoly = 0;
    this.arrowPoly = 0;
    this.vt = .025;
    this.vdcoef = 1 / this.vt;
    this.rgain = .5;
    // this.lastvbc = 0;
    // this.lastvbe = 0;
    this.leakage = 1e-13;

    this.renderSize = 16;

    this.volts[0] = 0;
    this.volts[1] = -this.lastvbe;
    this.volts[2] = -this.lastvbc;

    this.setup();
    this.place();
  }

  setup() {
    this.vcrit = this.vt * Math.log(this.vt / (Math.sqrt(2) * this.leakage));
    this.fgain = this.beta / (this.beta + 1);
    this.noDiagonal = true;
  }

  nonLinear() {
    return true;
  }

  reset() {
    this.volts[0] = this.volts[1] = this.volts[2] = 0;
    return this.lastvbc = this.lastvbe = this.curcount_c = this.curcount_e = this.curcount_b = 0;
  }

  static get NAME() {
    return `Bipolar Junction Transistor`
  }

  draw(renderContext) {
    if (this.Circuit && this.Circuit.debugModeEnabled()) {
      super.debugdraw(renderContext);
    }

    //@dsign() = -@dsign()  unless (@flags & TransistorElm.FLAG_FLIP) is 0

    let hs2 = this.renderSize * this.dsign() * this.pnp;

    // calc collector, emitter posts
    this.coll = Util.newPointArray(2);
    this.emit = Util.newPointArray(2);

    [this.coll[0], this.emit[0]] = Util.interpolateSymmetrical(this.point1, this.point2, 1, hs2);

    // calc rectangle edges
    this.rect = Util.newPointArray(4);
    [this.rect[0], this.rect[1]] = Util.interpolateSymmetrical(this.point1, this.point2, 1 - (16 / this.dn()), this.renderSize);
    [this.rect[2], this.rect[3]] = Util.interpolateSymmetrical(this.point1, this.point2, 1 - (13 / this.dn()), this.renderSize);

    // calc points where collector/emitter leads contact rectangle
    [this.coll[1], this.emit[1]] = Util.interpolateSymmetrical(this.point1, this.point2, 1 - (13 / this.dn()), 6 * this.dsign() * this.pnp);

    // calc point where base lead contacts rectangle
    this.base = Util.interpolate(this.point1, this.point2, 1 - (this.renderSize / this.dn()));

    // rectangle
    this.rectPoly = Util.createPolygon(this.rect[0], this.rect[2], this.rect[3], this.rect[1]);

    // arrow
    /*
    if (this.pnp !== 1) {
      let pt = Util.interpolateSymmetrical(this.point1, this.point2, 1 - (11 / this.dn()), -5 * this.dsign() * this.pnp);
      this.arrowPoly = Util.calcArrow(this.emit[0], pt, 8, 4);

      console.log("ARROW POLY", this.arrowPoly, this.point1, this.point2, this.dn(), this.dsign(), this.pnp, this.emit[0], pt, "\n")
    }
    */

    // draw collector
    let color = renderContext.getVoltageColor(this.volts[1]);
    renderContext.drawLinePt(this.coll[0], this.coll[1], color);

    // draw emitter
    color = renderContext.getVoltageColor(this.volts[2]);
    renderContext.drawLinePt(this.emit[0], this.emit[1], color);

    // draw arrow
    //g.setColor(lightGrayColor);


    if(this.arrowPoly && this.arrowPoly.numPoints() > 0) {

      try {
        renderContext.drawPolygon(this.arrowPoly);
      } catch(e) {
        console.log(this.pnp);
        console.log(this.arrowPoly);
      }
    }

    // draw base
    color = renderContext.getVoltageColor(this.volts[0]);
//      g.setColor Color.gray  if Circuit.powerCheckItem
    renderContext.drawLinePt(this.point1, this.base, color);

    // draw dots
//      @curcount_b = @updateDotCount(-@ib, @curcount_b)
//      @drawDots @base, @point1, @curcount_b
//      @curcount_c = @updateDotCount(-@ic, @curcount_c)
//      @drawDots @coll[1], @coll[0], @curcount_c
//      @curcount_e = @updateDotCount(-@ie, @curcount_e)
//      @drawDots @emit[1], @emit[0], @curcount_e

    // draw dots
    renderContext.drawDots(this.base, this.point1, this);
    renderContext.drawDots(this.coll[1], this.coll[0], this);
    renderContext.drawDots(this.emit[1], this.emit[0], this);

    color = renderContext.getVoltageColor(this.volts[0]);
//      @setPowerColor true

    //g.fillPolygon(rectPoly);
    renderContext.drawPolygon(this.rectPoly, {stroke: color});

//      if (@needsHighlight() or Circuit.dragElm is this) and @dy() is 0
//        g.setColor(Color.white);
//        g.setFont(this.unitsFont);
//        CircuitComponent.setColor Color.white
//
//        ds = MathUtils.sign(@dx())
//        @drawCenteredText "B", @base.x1 - 10 * ds, @base.y - 5, Color.WHITE
//        @drawCenteredText "C", @coll[0].x1 - 3 + 9 * ds, @coll[0].y + 4, Color.WHITE # x+6 if ds=1, -12 if -1
//        @drawCenteredText "E", @emit[0].x1 - 3 + 9 * ds, @emit[0].y + 4, Color.WHITE

    if (this.emit[0] && this.emit[1]) {
      renderContext.drawCircle(this.emit[0].x, this.emit[0].y, 0, 0, "#F00", "#F00");
      renderContext.drawCircle(this.emit[1].x, this.emit[1].y, 0, 0, "#0F0", "#0F0");
    }

    if (this.emit[2]) {
      renderContext.drawCircle(this.emit[2].x, this.emit[2].y, 0, 0, "#00F", "#00F");
    }

    renderContext.drawPosts(this);
  }

  getPost(n) {
    if (n === 0)
      return this.point1;
    else if (n === 1)
      return this.coll[0];
    else
      return this.emit[0];
  }

  numPosts() {
    return 3;
  }

  getPower() {
    return ((this.volts[0] - this.volts[2]) * this.ib) + ((this.volts[1] - this.volts[2]) * this.ic);
  }

  place() {
    this.renderSize = 16;

    let hs = this.renderSize;

    let hs2 = hs * this.dsign() * this.pnp;

    this.coll = Util.newPointArray(2);
    this.emit = Util.newPointArray(2);
    this.rect = Util.newPointArray(4);

    [this.coll[0], this.emit[0]] = Util.interpolateSymmetrical(this.point1, this.point2, 1, hs2);

    [this.rect[0], this.rect[1]] = Util.interpolateSymmetrical(this.point1, this.point2, 1 - (16 / this.dn()), hs);
    [this.rect[2], this.rect[3]] = Util.interpolateSymmetrical(this.point1, this.point2, 1 - (13 / this.dn()), hs);
    [this.coll[1], this.emit[1]] = Util.interpolateSymmetrical(this.point1, this.point2, 1 - (13 / this.dn()), 6 * this.dsign() * this.pnp);

    this.base = Util.interpolateSymmetrical(this.point1, this.point2, 1 - (16 / this.dn()));

    this.rectPoly = Util.createPolygonFromArray(this.rect);

    this.setBboxPt(this.point1, this.point2, this.renderSize);

    if (this.pnp === 1) {
      this.arrowPoly = Util.calcArrow(this.emit[1], this.emit[0], 8, 4);
    } else {
      let pt = Util.interpolate(this.point1, this.point2, 1 - (11 / this.dn()), -5 * this.dsign() * this.pnp);

      this.arrowPoly = Util.calcArrow(this.emit[0], pt, 8, 4);
    }
  }

  // TODO: DI refactor by passing solver object
  limitStep(vnew, vold) {
    let arg = 0;  // TODO

    if ((vnew > this.vcrit) && (Math.abs(vnew - vold) > (2*this.vt))) {
      if (vold > 0) {
        arg = 1 + ((vnew - vold) / this.vt);

        if (arg > 0)
          vnew = vold + (this.vt * Math.log(arg));
        else
          vnew = this.vcrit;

      } else {
        vnew = this.vt * Math.log(vnew / this.vt);
      }
      this.getParentCircuit().Solver.converged = false;
    }

    return vnew;
  }

  stamp(stamper) {
    stamper.stampNonLinear(this.nodes[0]);
    stamper.stampNonLinear(this.nodes[1]);
    stamper.stampNonLinear(this.nodes[2]);
  }

  // TODO: DI refactor by passing solver object
  doStep(stamper) {
    var {subIterations} = this.getParentCircuit().Solver;

    var vbc = this.volts[0] - this.volts[1]; // typically negative
    var vbe = this.volts[0] - this.volts[2]; // typically positive

    var convergenceEpsilon = 0.01;
    if ((Math.abs(vbc - this.lastvbc) > convergenceEpsilon) || (Math.abs(vbe - this.lastvbe) > convergenceEpsilon)) {
      this.getParentCircuit().Solver.converged = false;
    }

    // "Damping" method (Najm p. 182)
    this.gmin = 0;

    if (subIterations > 100) {
      // TODO: Check validity here
      // if we have trouble converging, put a conductance in parallel with all P-N junctions.
      // Gradually increase the conductance value for each iteration.
      this.gmin = Math.exp(-9 * Math.log(10) * (1 - (subIterations / 3000.0)));
      if (this.gmin > .1)
        this.gmin = .1;
    }

    vbc = this.pnp * this.limitStep(this.pnp * vbc, this.pnp * this.lastvbc);
    vbe = this.pnp * this.limitStep(this.pnp * vbe, this.pnp * this.lastvbe);
    this.lastvbc = vbc;
    this.lastvbe = vbe;
    var pcoef = this.vdcoef * this.pnp;
    var expbc = Math.exp(vbc * pcoef);

    //if (expbc > 1e13 || Double.isInfinite(expbc))
    //     expbc = 1e13;
    var expbe = Math.exp(vbe * pcoef);
    if (expbe < 1)
      expbe = 1;

    //if (expbe > 1e13 || Double.isInfinite(expbe))
    //     expbe = 1e13;
    this.ie = this.pnp * this.leakage * (-(expbe - 1) + (this.rgain * (expbc - 1)));
    this.ic = this.pnp * this.leakage * ((this.fgain * (expbe - 1)) - (expbc - 1));
    this.ib = -(this.ie + this.ic);

    var gee = -this.leakage * this.vdcoef * expbe;
    var gec = this.rgain * this.leakage * this.vdcoef * expbc;
    var gce = -gee * this.fgain;
    var gcc = -gec * (1 / this.rgain);

    /**
     * Matrix stamps from p. 302 of Pillage.
     *
     * Node 0 is the base, node 1 the collector, node 2 the emitter.
     * Also stamp minimum conductance (gmin) between b,e and b,c
     */

    // Stamp BASE junction:
    stamper.stampMatrix(this.nodes[0], this.nodes[0], (-gee - gec - gce - gcc) + (this.gmin * 2));
    stamper.stampMatrix(this.nodes[0], this.nodes[1], (gec + gcc) - this.gmin);
    stamper.stampMatrix(this.nodes[0], this.nodes[2], (gee + gce) - this.gmin);

    // Stamp COLLECTOR junction:
    stamper.stampMatrix(this.nodes[1], this.nodes[0], (gce + gcc) - this.gmin);
    stamper.stampMatrix(this.nodes[1], this.nodes[1], -gcc + this.gmin);
    stamper.stampMatrix(this.nodes[1], this.nodes[2], -gce);

    // Stamp EMITTER junction:
    stamper.stampMatrix(this.nodes[2], this.nodes[0], (gee + gec) - this.gmin);
    stamper.stampMatrix(this.nodes[2], this.nodes[1], -gec);
    stamper.stampMatrix(this.nodes[2], this.nodes[2], -gee + this.gmin);

    // we are solving for v(k+1), not delta v, so we use formula 10.5.13, multiplying J by v(k)
    stamper.stampRightSide(this.nodes[0], -this.ib - ((gec + gcc) * vbc) - ((gee + gce) * vbe));
    stamper.stampRightSide(this.nodes[1], -this.ic + (gce * vbe) + (gcc * vbc));
    stamper.stampRightSide(this.nodes[2], -this.ie + (gee * vbe) + (gec * vbc));
  }

  getSummary() {
    var arr = [];

    arr[0] = `(${(this.pnp === -1) ? "PNP)" : "NPN)"}`;

    var vbc = this.volts[0] - this.volts[1];
    var vbe = this.volts[0] - this.volts[2];
    var vce = this.volts[1] - this.volts[2];

    if ((vbc * this.pnp) > 0.2) {
      arr[1] = ((vbe * this.pnp) > 0.2 ? "Saturation" : "Reverse active");
    } else {
      arr[1] = ((vbe * this.pnp) > 0.2 ? "Fwd active" : "Cutoff");
    }

    arr[2] = `Ic = ${Util.getUnitText(this.ic, "A")}`;
    arr[3] = `Ib = ${Util.getUnitText(this.ib, "A")}`;
    arr[4] = `Vbe = ${Util.getUnitText(vbe, "V")}`;
    arr[5] = `Vbc = ${Util.getUnitText(vbc, "V")}`;
    arr[6] = `Vce = ${Util.getUnitText(vce, "V")}`;

    return super.getSummary(arr);
  }

  getScopeValue(x) {
    switch (x) {
      case Oscilloscope.VAL_IB:
        return this.ib;
        break;
      case Oscilloscope.VAL_IC:
        return this.ic;
        break;
      case Oscilloscope.VAL_IE:
        return this.ie;
        break;
      case Oscilloscope.VAL_VBE:
        return this.volts[0] - this.volts[2];
        break;
      case Oscilloscope.VAL_VBC:
        return this.volts[0] - this.volts[1];
        break;
      case Oscilloscope.VAL_VCE:
        return this.volts[1] - this.volts[2];
        break;
    }
    return 0;
  }

  getScopeUnits(x) {
    switch (x) {
      case Oscilloscope.VAL_IB:
      case Oscilloscope.VAL_IC:
      case Oscilloscope.VAL_IE:
        return "A";
      default:
        return "V";
    }
  }

  canViewInScope() {
    return true;
  }
}

module.exports = TransistorElm;
