import "reflect-metadata";

import world from "./world";
import { Sim } from "./sim";
import "./style";

const sim = new Sim();
// const sim = Sim.load();

window.sim = sim;
world(sim);
sim.start();
