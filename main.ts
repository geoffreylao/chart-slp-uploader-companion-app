require('dotenv').config();

import * as fs from "fs";
import { SlippiGame, } from "@slippi/slippi-js";
import axios from "axios";
import * as promptSync from "prompt-sync";
import makeObj from "./obj";

const prompt = promptSync({ sigint: true });

// Variables for parse_folder function
let obj_arr = [];
let failed_inserts = 0;
let inserted = 0;
let totalFiles = fs.readdirSync('./').length;
let count = 0;
let duplicate = 0;

async function parse_slp(filename: string) {
  try {
    const game = new SlippiGame(filename);
    // Get game settings – stage, characters, etc
    const settings = game.getSettings();
    // Get metadata - start time, platform played on, etc
    const metadata = game.getMetadata();
    // Get computed stats - openings / kill, conversions, etc
    const stats = game.getStats();
    // Get frames – animation state, inputs, etc
    const frames = game.getFrames();

    const myobj = makeObj(settings, metadata, stats);

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

    const forLoop = async () => {
      console.log('Start')

      for (let i = 0; i < obj_arr.length; i++) {
        const myaxios = await axios
          .post('https://example.com', obj_arr[i])
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
