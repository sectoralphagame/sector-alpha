import { Cooldowns } from "./cooldowns";

describe("Cooldowns", () => {
  it("properly updates timer", () => {
    const cd = new Cooldowns("key");
    cd.use("key", 2);

    cd.update(0.5);

    expect(cd.timers.key).toBe(1.5);
  });

  it("properly calculates if ready", () => {
    const cd = new Cooldowns("key");
    cd.use("key", 2);

    cd.update(0.5);

    expect(cd.canUse("key")).toBe(false);
    cd.update(2);
    expect(cd.canUse("key")).toBe(true);
  });
});
