import { PubSub } from "@core/utils/pubsub";

type Events =
  | { type: "update-debug"; data: string | number; name: string }
  | { type: "remove-debug"; name: string };

export const eventHook = new PubSub<Events>();
