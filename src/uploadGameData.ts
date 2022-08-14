import axios from "axios";
import { ChartSlpGame } from "./data/types";

const CHART_SLP_ENDPOINT = "http://localhost:8080/";

/**
 * Upload data for a single game to chartslp.com
 *
 * @param game Chart.slp game data object
 * @returns status of the upload
 */
async function uploadGameData(
  game: ChartSlpGame
): Promise<"INSERTED" | "DUPLICATE" | "FAILED" | "UNKNOWN"> {
  try {
    const res = await axios.post(CHART_SLP_ENDPOINT, game);
    console.log(res.data);
    if (res.data.includes("inserted")) {
      return "INSERTED";
    }
    if (res.data.includes("duplicate")) {
      return "DUPLICATE";
    }
    return "UNKNOWN";
  } catch (err) {
    console.error(`Axios error: ${err}`);
    return "FAILED";
  }
}

export default uploadGameData;
