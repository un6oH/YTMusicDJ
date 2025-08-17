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
import { TensorflowMusiCNN, EssentiaTFInputExtractor }  from 'essentia.js/dist/essentia.js-model.es.js';
// import tfPkg from '@tensorflow/tfjs';
// const { tf } = tfPkg;
import * as tf from '@tensorflow/tfjs';
import { decode } from 'wav-decoder';

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
  // origin: ['http://127.0.0.1:5500/client/index.html']
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
    read(path.join(__dirname, "audio", `${id}.mp4`), callback);
    return;
  }

  console.log("downloading audio from video id:", id);
  ytdl(url, {
    format: "worstaudio",
    ffmpegLocation: "C:\\Users\\limho\\Apps\\YoutubeDownloader\\ffmpeg.exe",
    output: path.join(__dirname, "audio/%(id)s.%(ext)s"), 
  })
    .then(output => {
      // console.log(output)
      downloadedIDs.push(id);
      const dir = path.join(__dirname, `audio/${id}.mp4`)
      console.log("audio downloaded at: audio/" + id + ".mp4");
      try {
        read(dir, callback);
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

const models = {
  danceability: await import('./models/danceability-musicnn-msd-2/model.json', { assert: { type: 'json' } }), 
  // moodAggressive: require('./models/mood_aggressive-musicnn-msd-2'), 
  // moodHappy: require('./models/mood_happy-musicnn-msd-2'), 
  // moodRelaxed: require('./models/mood_relaxed-musicnn-msd-2'), 
  // moodSad: require('./models/mood_sad-musicnn-msd-2'), 
}

let extractor = null;
const musiCNNs = {
  danceability: new TensorflowMusiCNN(tf, './models/danceability-musicnn-msd-2', true)
}

const frameSize = 2048;
const hopSize = 512;

async function read(path, callback) {
  let audioBuffer;

  fs.readFile(path, (err, data) => {
    if (err) {
      callback(null, {
        type: "Reading file", 
        error: err
      });
      return;
    }

    // const inputSignalVector = essentia.arrayToVector(audioBuffer);
    
    // let outputRG = essentia.ReplayGain(inputSignalVector, 44100); 
    // // console.log(outputRG.replayGain);
    // let replayGain = outputRG.replayGain;
  
    // let outputPyYin = essentia.PitchYinProbabilistic(
    //   inputSignalVector, 
    //   4096, // frameSize 
    //   256, // hopSize
    //   0.1, // lowRMSThreshold
    //   'zero', // outputUnvoiced,
    //   false, // preciseTime
    //   44100
    // ); //sampleRate
  
    // let pitches = essentia.vectorToArray(outputPyYin.pitch);
    // let voicedProbabilities = essentia.vectorToArray(outputPyYin.voicedProbabilities);
    // callback({replayGain, pitches, voicedProbabilities});
  });
}

async function decode(data) {
  extractor = new EssentiaTFInputExtractor(EssentiaWASM, "musicnn", false);
  audioBuffer = data;
  const audioData = await decode(audioBuffer);
  const channelData = audioData.channelData[0];

  const spectrumFrames = essentia.FrameGenerator(channelData, frameSize, hopSize, true)
    .map(frame => essentia.Spectrum(frame).spectrum);

  const melBandsFrames = spectrumFrames.map(spectrum => 
    essentia.MelBands({ spectrum }).melBands
  );

  console.log("decoded data to melBandsFrames:", melBandsFrames);
  // let audioData;
  // decode(audioBuffer)
  //   .then((data) => {
  //     audioData = data;
  //     const channelData = audioData.channelData[0];
  //   })
  //   .catch(error => callback(null, {
  //     type: "Decoding", 
  //     error: error
  //   }));
  


  // moodAnalyse(audioBuffer)
  //   .then((predictions) => {
  //     console.log(predictions);
  //     callback({predictions});
  //   })
  //   .catch(error => {
  //     callback(null, {
  //       type: "Analysis", 
  //       error: error
  //     });
  //   });
}

async function moodAnalyse(buffer) {
  const audioData = await extractor.downsampleAudioBuffer(buffer);
  const features = await extractor.computeFrameWise(audioData, 256);
  await musicnn.danceability.initialize();
  const predictions = await musicnn.predict(features, true);

  return predictions;
}

app.listen(port, (error) => {

});