import { Engine } from "@ogl-engine/engine/engine3d";
import { OglCanvas } from "@ogl-engine/OglCanvas";
import React from "react";

export class StrategicMap extends React.PureComponent {
  engine: Engine;

  constructor(props: any) {
    super(props);
    this.engine = new Engine();
  }

  render() {
    return <OglCanvas engine={this.engine} />;
  }
}
