import type { Position2D } from "../../components/position";
import { Entity } from "../../entity";
import { Sim } from "../../sim";
import { SectorIndex } from "./sectorIndex";

const defaultPosition = {
  name: "position",
  angle: 0,
  coord: [0, 0] as Position2D,
  moved: false,
  sector: 1,
} as const;

describe("SectorIndex", () => {
  let sim: Sim;
  let index: SectorIndex<"name">;

  beforeEach(() => {
    sim = new Sim();
    index = new SectorIndex(["name"], []);
  });

  it("properly handles sim lifecycle", () => {
    expect(index.sim).toBeNull();

    index.apply(sim);
    expect(index.sim).toBe(sim);

    sim.destroy();
    expect(index.sim).toBeNull();
  });

  it("properly caches entities", () => {
    index.apply(sim);
    expect(index.getSectors()).toHaveLength(0);

    const entity = new Entity(sim);
    entity
      .addComponent({ name: "name", value: "test" })
      .addComponent(defaultPosition);
    expect(index.getSectors()).toHaveLength(1);
    expect(index.sectors[1].size).toBe(1);
  });

  it("properly removes no longer accepted entities", () => {
    index.apply(sim);
    const entity = new Entity(sim);
    entity
      .addComponent({ name: "name", value: "test" })
      .addComponent(defaultPosition);
    entity.removeComponent("name");
    expect(index.getSectors()).toHaveLength(1);
    expect(index.sectors[1].size).toBe(0);
  });

  it("properly removes unregistered entities", () => {
    index.apply(sim);
    const entity = new Entity(sim);
    entity
      .addComponent({ name: "name", value: "test" })
      .addComponent(defaultPosition);
    entity.unregister("test");
    expect(index.sectors[1].size).toBe(0);
  });

  it("properly cleans cache", () => {
    index.apply(sim);
    const entity = new Entity(sim);
    entity
      .addComponent({ name: "name", value: "test" })
      .addComponent(defaultPosition);

    index.clear();
    expect(index.getSectors()).toHaveLength(0);
  });

  it("properly cleans cache after sim destroying", () => {
    index.apply(sim);
    const entity = new Entity(sim);
    entity
      .addComponent({ name: "name", value: "test" })
      .addComponent(defaultPosition);
    sim.destroy();
    expect(index.getSectors).toThrow();
  });

  it("properly collects entities", () => {
    const entity = new Entity(sim);
    entity
      .addComponent({ name: "name", value: "test" })
      .addComponent(defaultPosition);
    index.apply(sim);

    expect(index.sectors[1].size).toBe(1);
  });

  it("properly handles entities moving between sectors", () => {
    index.apply(sim);
    const entity = new Entity(sim);
    entity
      .addComponent({ name: "name", value: "test" })
      .addComponent(defaultPosition);

    entity.cp.position!.sector = 2;
    SectorIndex.notify(1, 2, entity);

    expect(index.getSectors()).toHaveLength(2);
    expect(index.sectors[1].size).toBe(0);
    expect(index.sectors[2].size).toBe(1);
  });
});
