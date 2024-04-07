import { mainFfwTutorialAutoorderMissionHandler } from "./main/ffw/tutorial-autoorder";
import { mainFfwTutorialEscortMissionHandler } from "./main/ffw/tutorial-escort";
import { mainFfwTutorialMinerMissionHandler } from "./main/ffw/tutorial-miner";
import { mainFfwTutorialPiratesMissionHandler } from "./main/ffw/tutorial-pirates";
import { mainFfwTutorialTradeMissionHandler } from "./main/ffw/tutorial-trade";
import {
  missionRewardHandler,
  moneyRewardHandler,
  relationRewardHandler,
} from "./rewards";

export const rewards = {
  money: moneyRewardHandler,
  relation: relationRewardHandler,
  mission: missionRewardHandler,
};

export const missions = {
  "main.ffw.tutorial-miner": mainFfwTutorialMinerMissionHandler,
  "main.ffw.tutorial-trade": mainFfwTutorialTradeMissionHandler,
  "main.ffw.tutorial-autoorder": mainFfwTutorialAutoorderMissionHandler,
  "main.ffw.tutorial-escort": mainFfwTutorialEscortMissionHandler,
  "main.ffw.tutorial-pirates": mainFfwTutorialPiratesMissionHandler,
};
