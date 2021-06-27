// .slp parsing function imports
require('dotenv').config();
const {
  SlippiGame
} = require('@slippi/slippi-js');
const fs = require('fs');
const axios = require('axios')
const prompt = require('prompt-sync')({
  sigint: true
});

// Variables for parse_folder function
var obj_arr = [];
var failed_inserts = 0;
var inserted = 0;
var totalFiles = fs.readdirSync('./').length;
var count = 0;
var duplicate = 0;

async function parse_slp(filename) {
  try {
    var game = new SlippiGame(filename);
    // Get game settings – stage, characters, etc
    var settings = game.getSettings();
    // Get metadata - start time, platform played on, etc
    var metadata = game.getMetadata();
    // Get computed stats - openings / kill, conversions, etc
    var stats = game.getStats();
    // Get frames – animation state, inputs, etc
    const frames = game.getFrames();

    var p0_conversions = [];
    var p1_conversions = [];

    for (let index = 0; index < stats.conversions.length; index++) {
      if (stats.conversions[index].playerIndex == 0) {
        p0_conversions.push(stats.conversions[index]);
      } else if (stats.conversions[index].playerIndex == 1) {
        p1_conversions.push(stats.conversions[index]);
      }
    }

    var p0_stocks = [];
    var p1_stocks = [];
    p0Kills = 0;
    p1Kills = 0;

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

    var stage_dict = {
      2: "FOUNTAIN_OF_DREAMS",
      3: "POKEMON_STADIUM",
      4: "PEACHS_CASTLE",
      5: "KONGO_JUNGLE",
      6: "BRINSTAR",
      7: "CORNERIA",
      8: "YOSHIS_STORY",
      9: "ONETT",
      10: "MUTE_CITY",
      11: "RAINBOW_CRUISE",
      12: "JUNGLE_JAPES",
      13: "GREAT_BAY",
      14: "HYRULE_TEMPLE",
      15: "BRINSTAR_DEPTHS",
      16: "YOSHIS_ISLAND",
      17: "GREEN_GREENS",
      18: "FOURSIDE",
      19: "MUSHROOM_KINGDOM",
      20: "MUSHROOM_KINGDOM_2",
      22: "VENOM",
      23: "POKE_FLOATS",
      24: "BIG_BLUE",
      25: "ICICLE_MOUNTAIN",
      26: "ICETOP",
      27: "FLAT_ZONE",
      28: "DREAMLAND",
      29: "YOSHIS_ISLAND_N64",
      30: "KONGO_JUNGLE_N64",
      31: "BATTLEFIELD",
      32: "FINAL_DESTINATION"
    }

    var char_dict = {
      0: "CAPTAIN_FALCON",
      1: "DONKEY_KONG",
      2: "FOX",
      3: "GAME_AND_WATCH",
      4: "KIRBY",
      5: "BOWSER",
      6: "LINK",
      7: "LUIGI",
      8: "MARIO",
      9: "MARTH",
      10: "MEWTWO",
      11: "NESS",
      12: "PEACH",
      13: "PIKACHU",
      14: "ICE_CLIMBERS",
      15: "JIGGLYPUFF",
      16: "SAMUS",
      17: "YOSHI",
      18: "ZELDA",
      19: "SHEIK",
      20: "FALCO",
      21: "YOUNG_LINK",
      22: "DR_MARIO",
      23: "ROY",
      24: "PICHU",
      25: "GANONDORF"
    }

    function check_winner(stats) {

      var player_zero_percent;
      var player_one_percent;
      var winner;

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
          return "INCOMPLETE"

      }
    }

    var myobj = {
      matchid: metadata.startAt + metadata.players[0].names.code + metadata.players[1].names.code,
      settings: {
        isTeams: settings.isTeams,
        isPal: settings.isPAL,
        stageId: settings.stageId,
        stageString: stage_dict[settings.stageId],
      },
      metadata: {
        startAt: new Date(metadata.startAt),
        lastFrame: metadata.lastFrame,
        minutes: stats.overall[0].inputsPerMinute.total,
        gameComplete: check_winner(stats) === "INCOMPLETE" ? false : true,
        winner: check_winner(stats),
        firstBlood: metadata.players[stats.stocks[0].playerIndex].names.code
      },
      players: [{
          playerIndex: settings.players[0].playerIndex,
          characterId: settings.players[0].characterId,
          characterColor: settings.players[0].characterColor,
          code: metadata.players[0].names.code,
          name: metadata.players[0].names.netplay,
          characterString: char_dict[settings.players[0].characterId],
          actionCounts: {
            wavedashCount: stats.actionCounts[0].wavedashCount,
            wavelandCount: stats.actionCounts[0].wavelandCount,
            airDodgeCount: stats.actionCounts[0].airDodgeCount,
            dashDanceCount: stats.actionCounts[0].dashDanceCount,
            spotDodgeCount: stats.actionCounts[0].spotDodgeCount,
            ledgegrabCount: stats.actionCounts[0].ledgegrabCount,
            rollCount: stats.actionCounts[0].rollCount
          },
          conversions: p1_conversions,
          inputCounts: {
            buttons: stats.overall[0].inputCounts.buttons, // digital inputs
            triggers: stats.overall[0].inputCounts.triggers,
            cstick: stats.overall[0].inputCounts.cstick,
            joystick: stats.overall[0].inputCounts.joystick,
            total: stats.overall[0].inputCounts.total // total inputs
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
          lcancelPercent: parseInt((stats.actionCounts[0].lCancelCount.success / (stats.actionCounts[0].lCancelCount.success + stats.actionCounts[0].lCancelCount.fail)) * 100),
          grabCount: stats.actionCounts[0].grabCount,
          throwCount: stats.actionCounts[0].throwCount,
          groundTechCount: stats.actionCounts[0].groundTechCount,
          wallTechCount: stats.actionCounts[0].wallTechCount,
          stocks: p0_stocks
        },
        {
          playerIndex: settings.players[1].playerIndex,
          characterId: settings.players[1].characterId,
          characterColor: settings.players[1].characterColor,
          code: metadata.players[1].names.code,
          name: metadata.players[1].names.netplay,
          characterString: char_dict[settings.players[1].characterId],
          actionCounts: {
            wavedashCount: stats.actionCounts[1].wavedashCount,
            wavelandCount: stats.actionCounts[1].wavelandCount,
            airDodgeCount: stats.actionCounts[1].airDodgeCount,
            dashDanceCount: stats.actionCounts[1].dashDanceCount,
            spotDodgeCount: stats.actionCounts[1].spotDodgeCount,
            ledgegrabCount: stats.actionCounts[1].ledgegrabCount,
            rollCount: stats.actionCounts[1].rollCount
          },
          conversions: p0_conversions,
          inputCounts: {
            buttons: stats.overall[1].inputCounts.buttons, // digital inputs
            triggers: stats.overall[1].inputCounts.triggers,
            cstick: stats.overall[1].inputCounts.cstick,
            joystick: stats.overall[1].inputCounts.joystick,
            total: stats.overall[1].inputCounts.total // total inputs
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
          lcancelPercent: parseInt((stats.actionCounts[1].lCancelCount.success / (stats.actionCounts[1].lCancelCount.success + stats.actionCounts[1].lCancelCount.fail)) * 100),
          grabCount: stats.actionCounts[1].grabCount,
          throwCount: stats.actionCounts[1].throwCount,
          groundTechCount: stats.actionCounts[1].groundTechCount,
          wallTechCount: stats.actionCounts[1].wallTechCount,
          stocks: p1_stocks
        }
      ],
    };

    obj_arr.push(myobj);
  } catch (error) {
    console.log("Error parsing: " + (filename));
    failed_inserts++;
  }
}

fs.readdir('.', (err, files) => {
  if (err)
    console.log(err);
  else {
    for (const file of files) {
      console.log(`Parsing: ${file} (${++count}/${totalFiles})`)

      parse_slp(file);
    }

    const forLoop = async _ => {
      console.log('Start')

      for (let i = 0; i < obj_arr.length; i++) {
        const myaxios = await axios
          .post('https://chart-slp-server.herokuapp.com/api/matches/external', obj_arr[i])
          .then(res => {
            if (res.data.includes('inserted')) {
              inserted++;
            }
            if (res.data.includes('duplicate')) {
              duplicate++;
            }
            console.log(res.data)
          })
          .catch(error => {
            console.error('Axios Error')
          })
      }
      console.log('End')
      console.log(`Inserted: ${inserted}\nDuplicates: ${duplicate}\nFailed: ${failed_inserts}`)
      const name = prompt('Press Enter to exit');
    }

    forLoop()

  }
})