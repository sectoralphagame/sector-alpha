import { Howl } from "howler";
import click from "./click.wav";
import notification from "./notification.wav";
import pop from "./pop.wav";

export default {
  click: new Howl({
    src: click,
    volume: 0.2,
  }),
  notification: new Howl({
    src: notification,
    volume: 0.2,
  }),
  pop: new Howl({
    src: pop,
    volume: 0.2,
  }),
};
