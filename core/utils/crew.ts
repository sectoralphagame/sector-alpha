import type { RequireComponent } from "@core/tsHelpers";

export function getRequiredCrew(
  crewableWithModules: RequireComponent<"crew" | "modules">
): number {
  return crewableWithModules.cp.modules.ids
    .map((id) => crewableWithModules.sim.getOrThrow(id))
    .filter(
      (fm) =>
        (fm.cp.production ? fm.cp.production.active : true) &&
        fm.cp.crewRequirement?.value
    )
    .map((fm) => fm.cp.crewRequirement!.value)
    .reduce((acc, val) => acc + val, 0);
}
