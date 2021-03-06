let CircuitComponent = require("./CircuitComponent.js");
let Util = require('../util/Util');

class DiacElm extends CircuitComponent {
  static get Fields() {
    return {
      onresistance: {
        name: "On Resistance",
        data_type: parseFloat
      },
      offresistance: {
        name: "Off Resistance",
        data_type: parseFloat
      },
      breakdown: {
        name: "Breakdown Voltage",
        data_type: parseFloat
      },
      holdCurrent: {
        name: "Hold Current",
        data_type: parseFloat
      }
    };
  }

  constructor(xa, xb, ya, yb, params, f) {
    super(xa, xb, ya, yb, params, f);
  }

  nonLinear() {
    return true;
  }

  setPoints() {
    super.setPoints(...arguments);
    this.calcLeads(32);
    this.ps3 = new Point(0, 0);
    return this.ps4 = new Point(0, 0);
  }

  calculateCurrent() {
    let vd = this.volts[0] - this.volts[1];

    if (state) {
      return this.current = vd / this.onresistance;
    } else {
      return this.current = vd / this.offresistance;
    }
  }

  draw(renderContext) {
    let v1 = this.volts[0];
    let v2 = this.volts[1];

    this.setBbox(this.point1, this.point2, 6);
    this.draw2Leads(g);

    renderContext.drawLeads(this);
    renderContext.drawPosts(this);

    return this.updateDots();
  }


  startIteration() {
    let vd = this.volts[0] - this.volts[1];

    if (Math.abs(this.current) < this.holdcurrent) { this.state = false; }
    if (Math.abs(vd) > this.breakdown) { return this.state = true; }
  }


  doStep(stamper) {
    if (this.state) {
      return stamper.stampResistor(this.nodes[0], this.nodes[1], this.onResistance);
    } else {
      return stamper.stampResistor(this.nodes[0], this.nodes[1], this.offResistance);
    }
  }

  stamp(stamper) {
    stamper.stampNonLinear(this.nodes[0]);
    return stamper.stampNonLinear(this.nodes[1]);
  }

  needsShortcut() {
    return false;
  }
}


module.exports = DiacElm;
