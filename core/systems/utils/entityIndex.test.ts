import { Entity } from "../../entity";
import { Sim } from "../../sim";
import { EntityIndex } from "./entityIndex";

describe("EntityIndex", () => {
  let sim: Sim;
  let entityIndex: EntityIndex<"name">;

  beforeEach(() => {
    sim = new Sim();
    entityIndex = new EntityIndex(["name"], [], true);
  });

  it("properly handles sim lifecycle", () => {
    const cacheSpy = jest.spyOn(entityIndex, "enableCache");
    expect(entityIndex.sim).toBeNull();
    expect(cacheSpy).not.toBeCalled();

    entityIndex.apply(sim);
    expect(entityIndex.sim).toBe(sim);
    expect(cacheSpy).toBeCalled();

    sim.destroy();
    expect(entityIndex.sim).toBeNull();
  });

  it("properly caches entities", () => {
    entityIndex.apply(sim);
    expect(entityIndex.entities.size).toBe(0);

    const entity = new Entity(sim);
    entity.addComponent({ name: "name", value: "test" });
    expect(entityIndex.entities.size).toBe(1);
  });

  it("properly removes no longer accepted entities", () => {
    entityIndex.apply(sim);
    const entity = new Entity(sim);
    entity.addComponent({ name: "name", value: "test" });
    entity.removeComponent("name");
    expect(entityIndex.entities.size).toBe(0);
  });

  it("properly removes unregistered entities", () => {
    entityIndex.apply(sim);
    const entity = new Entity(sim);
    entity.addComponent({ name: "name", value: "test" });
    entity.unregister("test");
    expect(entityIndex.entities.size).toBe(0);
  });

  it("properly cleans cache", () => {
    entityIndex.apply(sim);
    const entity = new Entity(sim);
    entity.addComponent({ name: "name", value: "test" });

    entityIndex.clear();
    expect(entityIndex.entities.size).toBe(0);
  });

  it("properly cleans cache after sim destroying", () => {
    entityIndex.apply(sim);
    const entity = new Entity(sim);
    entity.addComponent({ name: "name", value: "test" });
    sim.destroy();
    expect(entityIndex.entities.size).toBe(0);
  });

  it("properly collects entities", () => {
    const entity = new Entity(sim);
    entity.addComponent({ name: "name", value: "test" });
    entityIndex.apply(sim);

    expect(entityIndex.entities.size).toBe(1);
  });
});
