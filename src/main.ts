import * as fs from "fs/promises";
import { partition, chunk } from "lodash";
import parseSlp from "./parseSlp";
import prompt from "./utils/prompt";
import { ChartSlpGame } from "./data/types";
import uploadGameData from "./uploadGameData";

// Games will be uploaded to chartslp in batches. Change this value to set how
// many games will be in each batch. I don't know how much the server can handle
// at a time so I set it to a modest value of 3. This should improve upload
// times by ~3x
const MAX_SIMULTANEOUS_UPLOADS = 3;

async function main() {
  // Counters for uploaded games
  let inserted = 0;
  let duplicate = 0;

  try {
    // Find slippi replay files in current directory
    const entries = await fs.readdir(".", { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".slp"))
      .map((entry) => entry.name);

    const totalFiles = files.length;

    // Parse all replay files concurrently rather than in sequence
    const gameData = await Promise.all(
      files.map((filename, i) => parseSlp(filename, i, totalFiles))
    );

    // Results from parsing will either be a data object if successfully parsed,
    // or null if it failed. Here we'll separate the results into two arrays,
    // one of nulls (failures) and the other of data objects (successes)
    const [failures, parsedGames] = partition(
      gameData,
      (game) => game === null
    ) as [null[], ChartSlpGame[]];

    let failedInserts = failures.length;

    console.log("Start");

    // Split the parsed games into batches of 3
    const gameBatches = chunk(parsedGames, MAX_SIMULTANEOUS_UPLOADS);

    // Upload 3 games at a time, then update the relevant counters
    for (const gameBatch of gameBatches) {
      const results = await Promise.all(gameBatch.map(uploadGameData));
      for (const result of results) {
        if (result === "INSERTED") inserted++;
        else if (result === "DUPLICATE") duplicate++;
        else if (result === "FAILED") failedInserts++;
      }
    }

    console.log("End");
    console.log(
      `Inserted: ${inserted}\nDuplicates: ${duplicate}\nFailed: ${failedInserts}`
    );
    await prompt("Press Enter to exit");
  } catch (err) {
    console.error(err);
  }
}

main();
