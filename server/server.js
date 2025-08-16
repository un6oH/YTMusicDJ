// const express = require('express');
// const path = require('path');
// const cors = require('cors');
// const fs = require('fs');
// let esPkg = require('essentia.js');
// const ytdl = require('youtube-dl-exec');
// const axios = require('axios');

// const Essentia = require('essentia.js/dist/essentia.js-core.umd.js');
// const wasmModule = require('essentia.js/dist/essentia-wasm.umd.js');

import express from 'express';
import path from 'path';
import cors from 'cors'
import fs from 'fs';
import ytdl from 'youtube-dl-exec';

import Essentia from 'essentia.js/dist/essentia.js-core.es.js';
// import essentia-wasm backend
import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.es.js';

let essentia = null;
essentia = new Essentia(EssentiaWASM);
console.log("Powered by Essentia.js v." + essentia.version);

const __dirname = path.resolve();

const port = process.env.PORT || 3001;
const downloadQuality = '64';

const app = express();

const downloadedIDs = [];
fs.readdir(path.join(__dirname, "audio"), (err, files) => {
  if (err) {
    console.error('Unable to scan directory:', err);
    return;
  }

  files.forEach((fileName) => downloadedIDs.push(fileName.slice(0, fileName.length - 4)));
  // console.log("Files:", files);
  console.log('Downloaded IDs:', downloadedIDs);
});


app.use(cors({
  // origin: ['http://127.0.0.1:5500/index.html']
}));

app.get('/analyse', (req, res) => {
  const id = req.query.id;
  
  download(id, (features, error = null) => {
    if (!features) {
      res.status(500);
      console.log(`analysis failed song id: ${id}`, error);
    } else {
      res.status(200).send(features);
      console.log(`analysis success song id: ${id}`);
    }
  });
});

async function download(id, callback) {
  const url = "https://www.youtube.com/watch?v=" + id;
  if (downloadedIDs.includes(id)) {
    console.log("audio already downloaded.");
    analyse(path.join(__dirname, "audio", `${id}.mp4`), callback);
    return;
  }

  console.log("downloading audio from video id:", id);
  ytdl(url, {
    format: "worstaudio",
    ffmpegLocation: "C:\\Users\\limho\\Apps\\YoutubeDownloader\\ffmpeg.exe",
    output: path.join(__dirname, "audio/%(id)s.%(ext)s"), 
  })
    .then(output => {
      console.log(output)
      downloadedIDs.push(id);
      const dir = path.join(__dirname, `audio/${id}.mp4`)
      console.log("audio downloaded at: audio/" + id + ".mp4");
      try {
        analyse(dir, callback);
      } catch (error) {
        callback(null, {
          type: "analysis error", 
          error: error
        });
      }
    })
    .catch(error => {
      callback(null, {
        type: "download error", 
        error: error
      });
    });

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

app.listen(port, (error) => {

});