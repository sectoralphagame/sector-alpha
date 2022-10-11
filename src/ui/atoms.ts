import { atom, useRecoilState } from "recoil";
import type { Sim } from "../sim";

export const sim = atom<Sim>({
  key: "sim",
  default: window.sim as Sim,
  dangerouslyAllowMutability: true,
});
export const useSim = () => useRecoilState(sim);
