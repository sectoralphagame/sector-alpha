// import "reflect-metadata";

// import world from "./world";
// import { Sim } from "./sim";
// import "./style";

// const sim = new Sim();
// sim.init();

// window.sim = sim;
// world(sim);
// sim.start();

import "reflect-metadata";

import { Sim } from "./sim";
import "./style";

const sim = Sim.load();

window.sim = sim;
sim.start();
