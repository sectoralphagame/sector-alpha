import type { MissionConversation } from "@core/systems/mission/types";
import Mustache from "mustache";

export function pickRandomWithIndex<T>(arr: readonly T[]): [T, number] {
  const index = Math.floor(Math.random() * arr.length);
  return [arr[index], index];
}

export function pickRandom<T>(arr: readonly T[]): T {
  return pickRandomWithIndex(arr)[0];
}

Mustache.escape = (text) => text;
export function mustacheConversation(
  template: MissionConversation,
  data: Record<string, string>
): MissionConversation {
  const conversation = structuredClone(template);
  // eslint-disable-next-line guard-for-in
  for (const actor in conversation.Actors) {
    if (conversation.Actors[actor].name) {
      conversation.Actors[actor].name = Mustache.render(
        conversation.Actors[actor].name!,
        data
      );
    }
    // eslint-disable-next-line guard-for-in
    for (const line in conversation.Actors[actor].lines) {
      conversation.Actors[actor].lines[line].text = Mustache.render(
        conversation.Actors[actor].lines[line].text,
        data
      );
    }
  }

  return conversation;
}
