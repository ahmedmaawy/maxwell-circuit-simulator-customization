let Util = require('../util/Util');

let MosfetElm = require('./MosfetElm');

class JfetElm extends MosfetElm {
  constructor(xa, ya, xb, yb, params, f) {
    super(xa, ya, xb, yb, params, f);
    this.noDiagonal = true;

    this.place()
  }

  getDefaultThreshold() {
    return -4;
  }

  getBeta() {
    return .00125;
  }

  static get NAME() {
    return "JFET Transistor"
  }

  place() {
    super.place();

    let hs2 = this.hs * this.dsign();

    this.src = Util.newPointArray(3);
    this.drn = Util.newPointArray(3);

    [this.src[0], this.drn[0]] = Util.interpolateSymmetrical(this.point1, this.point2, 1, hs2);
    [this.src[1], this.drn[1]] = Util.interpolateSymmetrical(this.point1, this.point2, 1, hs2 / 2);
    [this.src[2], this.drn[2]] = Util.interpolateSymmetrical(this.point1, this.point2, 1 - (10 / this.dn()), hs2 / 2);

    this.gatePt = Util.interpolate(this.point1, this.point2, 1 - (14/this.dn()));

    let ra = Util.newPointArray(4);
    [ra[0], ra[1]] = Util.interpolateSymmetrical(this.point1, this.point2, 1 - (13/this.dn()), this.hs);
    [ra[2], ra[3]] = Util.interpolateSymmetrical(this.point1, this.point2, 1 - (10/this.dn()), this.hs);

    this.gatePoly = Util.createPolygonFromArray([ra[0], ra[1], ra[3], ra[2]]);

    if (this.pnp === -1) {
      let x = Util.interpolate(this.gatePt, this.point1, 15/this.dn());
      this.arrowPoly = Util.calcArrow(this.gatePt, x, 8, 3);
    } else {
      this.arrowPoly = Util.calcArrow(this.point1, this.gatePt, 8, 3);
    }

    this.setBboxPt(this.point1, this.point2, this.hs);
  }

  draw(renderContext) {
    if (this.Circuit && this.Circuit.debugModeEnabled()) {
      super.debugdraw(renderContext);
    }

    let color = renderContext.getVoltageColor(this.volts[1]);
    renderContext.drawLinePt(this.src[0], this.src[1], color);
    renderContext.drawLinePt(this.src[1], this.src[2], color);

    color = renderContext.getVoltageColor(this.volts[2]);
    renderContext.drawLinePt(this.drn[0], this.drn[1], color);
    renderContext.drawLinePt(this.drn[1], this.drn[2], color);

    color = renderContext.getVoltageColor(this.volts[0]);
    renderContext.drawLinePt(this.point1, this.gatePt, color);

    renderContext.drawPolygon(this.arrowPoly);
    renderContext.drawPolygon(this.gatePoly);

    if (this.curcount !== 0) {
      renderContext.drawDots(this.src[0], this.src[1], this);
      renderContext.drawDots(this.src[1], this.src[2], this);
      renderContext.drawDots(this.drn[0], this.drn[1], this);
      renderContext.drawDots(this.drn[1], this.drn[2], this);
    }

    return renderContext.drawPosts(this);
  }
}


module.exports = JfetElm;

