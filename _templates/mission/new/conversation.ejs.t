---
to: core/world/data/missions/<%= name.split(".").join("/") %>.yml
---

Start: npc.greeting

Actors:
  npc:
    name: NPC
    lines:
      greeting:
        text: Line
        next:
          - player.greeting

  player:
    lines:
      greeting:
        text: Response
