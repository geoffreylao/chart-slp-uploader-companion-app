# Uploader Companion App for Chart.slp

## How To Use (.exe):

1. Drag the .exe into your folder containing the .slp files
2. Run the .exe
3. Wait for the script to finish, it will prompt you to exit when complete

## ALTERNATIVE:
If you are wary of running an .exe on your machine you can also build the script yourself by building the script from the source code yourself, note: this requires Node and NPM installed
1. Download the source code .zip or clone the github repository
2. Open Command Prompt and navigate to wherever you placed the extracted .zip
3. Run 'npm install'
4. Once that's finished move all the .slp files you want to upload into the same folder as the script.js file
5. Back in the Command Prompt run 'node script.js'
6. Wait for your games to be parsed then uploaded, you will be given a prompt to close the script when its finished

## Known Issues
- Uploads of folders with an incredibly large amount of files can take several hours, please be patient! (Tested 14400 files: ~8 hours)
- Only supported for windows right now. 

## For Linux:
Thanks to itsonlyMire: "this companion app has been working well for me on Linux (Ubuntu 21.04). I use the method of running npm install and node script.js in the folder of my Slippi files and they upload successfully"

## For Mac:
You will have to download the source code and run 'npm install' inside the folder then place your .slp files in the containing folder and run 'node script.js'


