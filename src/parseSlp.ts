import {
  ConversionType,
  GameStartType,
  MetadataType,
  SlippiGame,
  StatsType,
  StockType,
} from "@slippi/slippi-js";
import characters from "./data/characters";
import stages from "./data/stages";
import { ChartSlpGame } from "./data/types";

interface ICheckWinner {
  stats: StatsType;
  metadata: MetadataType;
  p0Kills: number;
  p1Kills: number;
}

function checkWinner({
  stats,
  metadata,
  p0Kills,
  p1Kills,
}: ICheckWinner): string {
  let player_zero_percent: number;
  let player_one_percent: number;
  let winner: number;

  // set last stocks final percent
  for (let i = 0; i < stats.stocks.length; i++) {
    if (stats.stocks[i].playerIndex == 0) {
      player_zero_percent = stats.stocks[i].currentPercent;
    } else if (stats.stocks[i].playerIndex == 1) {
      player_one_percent = stats.stocks[i].currentPercent;
    }
  }

  if (p0Kills == 4) {
    winner = 0;
  } else if (p1Kills == 4) {
    winner = 1;
  } else if (metadata.lastFrame == 28800) {
    if (p0Kills > p1Kills) {
      winner = 0;
    } else if (p0Kills < p1Kills) {
      winner = 1;
    } else if (p0Kills === p1Kills) {
      if (player_zero_percent > player_one_percent) {
        winner = 1;
      } else if (player_zero_percent < player_one_percent) {
        winner = 0;
      } else if (player_zero_percent == player_one_percent) {
        winner = 2;
      }
    }
  } else {
    winner = 3;
  }

  switch (winner) {
    case 0:
      return metadata.players[0].names.code;
    case 1:
      return metadata.players[1].names.code;
    case 2:
      return "DRAW";
    case 3:
      return "INCOMPLETE";
  }
}

/**
 * Parse a single slippi replay file into a `ChartSlpGame` data object
 * 
 * @param filename 
 * @param currentIndex index of the current game file (only used for logging)
 * @param total total number of game files that we intend to parse 
 */
async function parseSlp(
  filename: string,
  currentIndex: number,
  total: number
): Promise<ChartSlpGame | null> {
  console.log(`Parsing: ${filename} (${currentIndex + 1}/${total})`);

  const game = new SlippiGame(filename);
  // Get game settings – stage, characters, etc
  const settings = game.getSettings();
  // Get metadata - start time, platform played on, etc
  const metadata = game.getMetadata();
  // Get computed stats - openings / kill, conversions, etc
  const stats = game.getStats();

  if (settings === null || metadata === null || stats === null) {
    return null;
  }

  let p0_conversions: ConversionType[] = [];
  let p1_conversions: ConversionType[] = [];

  for (let index = 0; index < stats.conversions.length; index++) {
    if (stats.conversions[index].playerIndex == 0) {
      p0_conversions.push(stats.conversions[index]);
    } else if (stats.conversions[index].playerIndex == 1) {
      p1_conversions.push(stats.conversions[index]);
    }
  }

  let p0_stocks: StockType[] = [];
  let p1_stocks: StockType[] = [];
  let p0Kills = 0;
  let p1Kills = 0;

  for (let index = 0; index < stats.stocks.length; index++) {
    if (stats.stocks[index].playerIndex == 0) {
      p0_stocks.push(stats.stocks[index]);
      if (stats.stocks[index].deathAnimation !== null) {
        p1Kills++;
      }
    } else if (stats.stocks[index].playerIndex == 1) {
      p1_stocks.push(stats.stocks[index]);
      if (stats.stocks[index].deathAnimation !== null) {
        p0Kills++;
      }
    }
  }

  const winner = checkWinner({
    stats,
    metadata,
    p0Kills,
    p1Kills,
  });

  const data: ChartSlpGame = {
    matchid:
      metadata.startAt +
      metadata.players[0].names.code +
      metadata.players[1].names.code,
    settings: {
      isTeams: settings.isTeams,
      isPal: settings.isPAL,
      stageId: settings.stageId,
      stageString: stages[settings.stageId],
    },
    metadata: {
      startAt: new Date(metadata.startAt),
      lastFrame: metadata.lastFrame,
      minutes: stats.overall[0].inputsPerMinute.total,
      gameComplete: winner === "INCOMPLETE" ? false : true,
      winner,
      firstBlood: metadata.players[stats.stocks[0].playerIndex].names.code,
    },
    players: [
      {
        playerIndex: settings.players[0].playerIndex,
        characterId: settings.players[0].characterId,
        characterColor: settings.players[0].characterColor,
        code: metadata.players[0].names.code,
        name: metadata.players[0].names.netplay,
        characterString: characters[settings.players[0].characterId],
        actionCounts: {
          wavedashCount: stats.actionCounts[0].wavedashCount,
          wavelandCount: stats.actionCounts[0].wavelandCount,
          airDodgeCount: stats.actionCounts[0].airDodgeCount,
          dashDanceCount: stats.actionCounts[0].dashDanceCount,
          spotDodgeCount: stats.actionCounts[0].spotDodgeCount,
          ledgegrabCount: stats.actionCounts[0].ledgegrabCount,
          rollCount: stats.actionCounts[0].rollCount,
        },
        conversions: p1_conversions,
        inputCounts: {
          buttons: stats.overall[0].inputCounts.buttons, // digital inputs
          triggers: stats.overall[0].inputCounts.triggers,
          cstick: stats.overall[0].inputCounts.cstick,
          joystick: stats.overall[0].inputCounts.joystick,
          total: stats.overall[0].inputCounts.total, // total inputs
        },
        conversionCount: stats.overall[0].conversionCount,
        totalDamage: stats.overall[0].totalDamage,
        killCount: p0Kills,
        creditedKillCount: stats.overall[0].killCount,
        successfulConversions: stats.overall[0].successfulConversions.count,
        openings: stats.overall[0].openingsPerKill.count,
        neutralWins: stats.overall[0].neutralWinRatio.count,
        counterHits: stats.overall[0].counterHitRatio.count,
        trades: stats.overall[0].beneficialTradeRatio.count,
        deathCount: p1Kills,
        lcancelPercent: Number(
          (stats.actionCounts[0].lCancelCount.success /
            (stats.actionCounts[0].lCancelCount.success +
              stats.actionCounts[0].lCancelCount.fail)) *
            100
        ),
        grabCount: stats.actionCounts[0].grabCount,
        throwCount: stats.actionCounts[0].throwCount,
        groundTechCount: stats.actionCounts[0].groundTechCount,
        wallTechCount: stats.actionCounts[0].wallTechCount,
        stocks: p0_stocks,
      },
      {
        playerIndex: settings.players[1].playerIndex,
        characterId: settings.players[1].characterId,
        characterColor: settings.players[1].characterColor,
        code: metadata.players[1].names.code,
        name: metadata.players[1].names.netplay,
        characterString: characters[settings.players[1].characterId],
        actionCounts: {
          wavedashCount: stats.actionCounts[1].wavedashCount,
          wavelandCount: stats.actionCounts[1].wavelandCount,
          airDodgeCount: stats.actionCounts[1].airDodgeCount,
          dashDanceCount: stats.actionCounts[1].dashDanceCount,
          spotDodgeCount: stats.actionCounts[1].spotDodgeCount,
          ledgegrabCount: stats.actionCounts[1].ledgegrabCount,
          rollCount: stats.actionCounts[1].rollCount,
        },
        conversions: p0_conversions,
        inputCounts: {
          buttons: stats.overall[1].inputCounts.buttons, // digital inputs
          triggers: stats.overall[1].inputCounts.triggers,
          cstick: stats.overall[1].inputCounts.cstick,
          joystick: stats.overall[1].inputCounts.joystick,
          total: stats.overall[1].inputCounts.total, // total inputs
        },
        conversionCount: stats.overall[1].conversionCount,
        totalDamage: stats.overall[1].totalDamage,
        killCount: p1Kills,
        creditedKillCount: stats.overall[1].killCount,
        successfulConversions: stats.overall[1].successfulConversions.count,
        openings: stats.overall[1].openingsPerKill.count,
        neutralWins: stats.overall[1].neutralWinRatio.count,
        counterHits: stats.overall[1].counterHitRatio.count,
        trades: stats.overall[1].beneficialTradeRatio.count,
        deathCount: p0Kills,
        lcancelPercent: Number(
          (stats.actionCounts[1].lCancelCount.success /
            (stats.actionCounts[1].lCancelCount.success +
              stats.actionCounts[1].lCancelCount.fail)) *
            100
        ),
        grabCount: stats.actionCounts[1].grabCount,
        throwCount: stats.actionCounts[1].throwCount,
        groundTechCount: stats.actionCounts[1].groundTechCount,
        wallTechCount: stats.actionCounts[1].wallTechCount,
        stocks: p1_stocks,
      },
    ],
  };

  return data;
}

export default parseSlp;
