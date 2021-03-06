let CircuitComponent = require('./CircuitComponent');

let Rectangle = require('../geom/Rectangle');
let Util = require("../util/Util.js");

let VoltageElm = require('./VoltageElm');


class RailElm extends VoltageElm {
  static initClass() {
    this.FLAG_CLOCK = 1;
  }

  constructor(xa, ya, xb, yb, params, f) {
    super(xa, ya, xb, yb, params, f);
  }

  numPosts() {
    return 1;
  }

  static get NAME() {
    return "Voltage Rail"
  }

  draw(renderContext) {
    this.lead1 = Util.interpolate(this.point1, this.point2, 1 - (VoltageElm.circleSize / this.dn()));

    //this.setBboxPt(this.point1, this.point2, VoltageElm.circleSize);

    //renderContext.drawLinePt(this.point2, this.lead1, renderContext.STROKE_COLOR, renderContext.LINE_WIDTH+1);

    let pt1, pt2;
    [pt1, pt2] = Util.interpolateSymmetrical(this.point2, this.lead1, 0, 8);

    renderContext.drawLinePt(pt1, pt2, renderContext.STROKE_COLOR, renderContext.LINE_WIDTH);

    renderContext.drawLinePt(this.point2, this.point1, renderContext.STROKE_COLOR);

    let color = renderContext.getVoltageColor(this.volts[0]);
    renderContext.drawLinePt(this.point1, this.lead1, color);

    let clock = (this.waveform === VoltageElm.WF_SQUARE) && ((this.flags & VoltageElm.FLAG_CLOCK) !== 0);

    this.updateDots();

    renderContext.drawDots(this.lead1, this.point1, this);
    renderContext.drawPosts(this);

    if ((this.waveform === VoltageElm.WF_DC) || (this.waveform === VoltageElm.WF_VAR) || clock) {
      color = "#FFFFFF";  //((if @needsHighlight() then renderContext.SELECT_COLOR else "#FFFFFF"))

      //this.setPowerColor(g, false);

      let v = this.getVoltage();

      let s = Util.getUnitText(v, "V", 1);
      if (Math.abs(v) < 1) { s = v + "V"; } //showFormat.format(v)
      if (this.getVoltage() > 0) { s = `+${s}`; }

      renderContext.drawText(s, this.point2.x+4, this.point2.y - 7, renderContext.TEXT_COLOR, 1.3*renderContext.TEXT_SIZE);

      if (clock) { s = "CLK"; }

    } else {
      this.drawWaveform(this.point2, renderContext);
    }

    if (this.Circuit && this.Circuit.debugModeEnabled()) {
      super.debugdraw(renderContext);
    }
  }

  getVoltageDiff() {
    return this.volts[0];
  }

  setPoints() {
    super.setPoints(...arguments);

    this.lead1 = Util.interpolate(this.point1, this.point2, 1 - (this.circleSize / this.dn()));
  }

  stamp(stamper) {
    if (this.waveform === VoltageElm.WF_DC) {
      return stamper.stampVoltageSource(0, this.nodes[0], this.voltSource, this.getVoltage());
    } else {
      return stamper.stampVoltageSource(0, this.nodes[0], this.voltSource);
    }
  }

  doStep(stamper) {
    if (this.waveform !== VoltageElm.WF_DC) {
      return stamper.updateVoltageSource(0, this.nodes[0], this.voltSource, this.getVoltage());
    }
  }

  hasGroundConnection(n1) {
    return true;
  }
}
RailElm.initClass();

module.exports = RailElm;
