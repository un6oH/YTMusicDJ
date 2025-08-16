const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const {getDownloadDetails} = require("youtube-downloader-cc-api");
const essentia = require('essentia.js');

// const Essentia = require('essentia.js/dist/essentia.js-core.umd.js');
// const wasmModule = require('essentia.js/dist/essentia-wasm.umd.js');

// const essentia = new Essentia(wasmModule.Module);
console.log("Powered by Essentia.js v." + essentia.version);

const port = process.env.PORT || 3001;
const downloadQuality = '64';

const app = express();

app.use(cors({
  // origin: ['http://127.0.0.1:5500/index.html']
}));

app.get('/analyse', (req, res) => {
  const id = req.query.id;
  const url = req.query.url;
  download(url, (features, error = null) => {
    if (!features) {
      res.status(500);
      console.log(`analysis failed song id: ${id}`, error);
    } else {
      res.status(200).send(features);
      console.log(`analysis success song id: ${id}`);
    }
  });
});

async function download(url, callback) {
  const type = 'mp3';
  const responseType = 'direct';

  try {
    const response = await getDownloadDetails(url, type, responseType);
    console.log("audio downloaded at:", response.path);
    analyse(response.path, callback);
  } catch (error) {
    callback(null, {
      type: "Download error", 
      error: error
    });
  }
}

async function analyse(path, callback) {
  let audioBuffer;

  fs.readFile(path, (err, data) => {
    if (err) {
      callback(null, {
        type: "Analysis error", 
        error: err
      });
      return;
    }

    audioBuffer = data;
    const inputSignalVector = essentia.arrayToVector(audioBuffer);
    
    let outputRG = essentia.ReplayGain(inputSignalVector, 44100); 
    // console.log(outputRG.replayGain);
    let replayGain = outputRG.replayGain;
  
    let outputPyYin = essentia.PitchYinProbabilistic(
      inputSignalVector, 
      4096, // frameSize 
      256, // hopSize
      0.1, // lowRMSThreshold
      'zero', // outputUnvoiced,
      false, // preciseTime
      44100
    ); //sampleRate
  
    let pitches = essentia.vectorToArray(outputPyYin.pitch);
    let voicedProbabilities = essentia.vectorToArray(outputPyYin.voicedProbabilities);
    callback({replayGain, pitches, voicedProbabilities});
  });
}

app.get('/ping', (req, res) => {
  res.status(200).send("Hello world!");
});

app.listen(port, (error) => {

});