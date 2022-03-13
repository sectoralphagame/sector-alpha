import { render } from "./render";
import { sim } from "./sim";
import world from "./world";

sim.load(world);
sim.start();

const root = document.querySelector("#canvasRoot");

render(sim, root);
