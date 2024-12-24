import { Engine2D } from "@ogl-engine/engine/engine2d";
import { OglCanvas } from "@ogl-engine/OglCanvas";
import React from "react";

export class StrategicMap extends React.PureComponent {
  engine: Engine2D;

  constructor(props: any) {
    super(props);
    this.engine = new Engine2D();
  }

  render() {
    return <OglCanvas engine={this.engine} />;
  }
}
