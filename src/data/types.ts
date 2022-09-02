import { ConversionType, StockType } from "@slippi/slippi-js";

export interface ChartSlpGame {
  matchid: string;
  settings: {
    isTeams: boolean;
    isPal: boolean;
    stageId: number;
    stageString: string;
  };
  metadata: {
    startAt: Date;
    lastFrame: number;
    minutes: number;
    gameComplete: boolean;
    winner: string;
    firstBlood: string;
  };
  players: Array<{
    playerIndex: number;
    characterId: number;
    characterColor: number;
    code: string;
    name: string;
    characterString: string;
    actionCounts: {
      wavedashCount: number;
      wavelandCount: number;
      airDodgeCount: number;
      dashDanceCount: number;
      spotDodgeCount: number;
      ledgegrabCount: number;
      rollCount: number;
    };
    conversions: ConversionType[];
    inputCounts: {
      buttons: number;
      triggers: number;
      cstick: number;
      joystick: number;
      total: number;
    };
    conversionCount: number;
    totalDamage: number;
    killCount: number;
    creditedKillCount: number;
    successfulConversions: number;
    openings: number;
    neutralWins: number;
    counterHits: number;
    trades: number;
    deathCount: number;
    lcancelPercent: number;
    grabCount: { success: number; fail: number };
    throwCount: { up: number; forward: number; back: number; down: number };
    groundTechCount: {
      backward: number;
      forward: number;
      neutral: number;
      fail: number;
    };
    wallTechCount: { success: number; fail: number };
    stocks: StockType[];
  }>;
}
