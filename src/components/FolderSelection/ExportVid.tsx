import { LooseObject } from "../../store/annot/types";
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function exportVideo(
  timeline: LooseObject,
  multiplier: number,
  vols: number[],
  outputPath: string
): boolean {
  const kings: number[] = [];
  const princes: number[] = [];
  // Do things
  const vidSource = timeline.syncMedia[0];
  const audSource = timeline.syncMedia[1];
  const thePlan: string[] = [];
  const theCode: LooseObject[] = [];
  vols.forEach((vol: number, index: number) => {
    if (vol >= 0.7) {
      kings.push(index);
    } else if (vol > 0) {
      princes.push(index);
    }
  });

  /* Pre-Process video adding timestamp if desired.
  Export to Standard Width. Place right aligned a certain distance from top right edge.
  
  https://superuser.com/questions/1013753/how-can-i-overlay-the-captured-timestamp-onto-a-video-using-ffmpeg-in-yyyy-mm-dd
  Example:
  ffmpeg -i in.webm -filter_complex "drawtext=fontfile=/usr/share/fonts/truetype/arial.ttf: text='%{pts \:flt}': x=100 : y=50 : box=1" -c:a copy out.webm
  */

  /*
  Multilingual
  https://superuser.com/questions/1078298/ffmpeg-combine-multiple-audio-files-and-one-video-in-to-the-multi-language-vid
  */

  /*
  Lafvi
  https://video.stackexchange.com/questions/27773/merge-two-videos-in-ffmpeg-with-audio-from-one
  */

  /* 
  OverLays
  https://stackoverflow.com/questions/49454740/multiple-overlays-using-ffmpeg
  */

  /*
  SubTitles
  Burn In: https://trac.ffmpeg.org/wiki/HowToBurnSubtitlesIntoVideo
  */

  /*
  Playback Speed
  https://trac.ffmpeg.org/wiki/How%20to%20speed%20up%20/%20slow%20down%20a%20video 
  */

  /*
  thirm and concat
  https://superuser.com/questions/1229945/ffmpeg-split-video-and-merge-back
  https://video.stackexchange.com/questions/20430/how-to-concatenate-multiple-videos-with-ffmpeg
  */

  /*
  Read State to get WS Volumes.
  First WS Vol>50, is KING, Next is PRINCE1, next is PRINCE2
  First WS Vol<50 is VO1, second is VO2.
  Video is VID
  i.e. KING=0, PRINCE1=1, VO1=2, PRINCE2=-1, VO2=-1
  */
  timeline.milestones.forEach((ms: LooseObject, msIndex: number) => {
    const V1 = vidSource;
    let V1Speed = -1;
    const V1Start = ms.startTime;
    const V1Stop = ms.stopTime;
    let A1 = "";
    let A1Start = -1;
    let A1Stop = -1;
    let A1Speed = -1;
    let A2 = "";
    let A2Start = -1;
    let A2Stop = -1;
    let A2Speed = -1;
    kings.forEach((king: number, kIndex: number) => {
      // Loops through and plays each King with each voiceover
      let kingLen = -1;
      if (king === 0) {
        // Just play the video at multiplier speed
        A1 = vidSource;
        A1Speed = multiplier;
        A1Start = ms.startTime;
        A1Stop = ms.stopTime;
        kingLen = (ms.stopTime - ms.startTime) * multiplier;
        V1Speed = multiplier;
      } else if (king === 1) {
        // Find and queue the clip of CarefulMerged at multiplier speed
        const thisData = getAudio("CarefulMerged", ms);
        if (thisData.file !== "") {
          A1 = thisData.file;
          A1Start = thisData.start;
          A1Stop = thisData.stop;
          kingLen = (A1Stop - A1Start) * multiplier;
          V1Speed = kingLen / (ms.stopTime - ms.startTime);
        }
      } else if (king === 2) {
        // Find and queue the clip of TranslationMerged at multiplier speed.
        const thisData = getAudio("TranslationMerged", ms);
        if (thisData.file !== "") {
          A1 = thisData.file;
          A1Start = thisData.start;
          A1Stop = thisData.stop;
          kingLen = (A1Stop - A1Start) * multiplier;
          V1Speed = kingLen / (ms.stopTime - ms.startTime);
        }
      }
      let dup = false;
      if (princes.length > 0) {
        princes.forEach((prince: number) => {
          if (prince === 0) {
            // Play the Audio Source at speed matching video.
            const A2 = audSource;
            A2Start = V1Start;
            A2Stop = V1Stop;
            A2Speed = V1Speed;
            theCode.push({
              V1,
              V1Start,
              V1Stop,
              V1Speed,
              A1,
              A1Start,
              A1Stop,
              A1Speed,
              A1Vol: vols[king],
              isA2: true,
              A2,
              A2Start,
              A2Stop,
              A2Speed,
              A2Vol: vols[prince],
              Comment: "King " + king + " with voiceover " + prince + ".",
            });
            thePlan.push(
              msIndex.toString() + " A1: " + A1 + ", V1: " + V1 + ", A2: " + A2
            );
            dup = true;
          }
          if (prince === 1) {
            // Play the CarefulMerged at calculated speed.
            const thisData = getAudio("CarefulMerged", ms);
            if (thisData.file !== "") {
              A2 = thisData.file;
              A2Start = thisData.start;
              A2Stop = thisData.stop;
              A2Speed = kingLen / (A2Stop - A2Start);
            }
            if (A2 !== "") {
              theCode.push({
                V1,
                V1Start,
                V1Stop,
                V1Speed,
                A1,
                A1Start,
                A1Stop,
                A1Speed,
                A1Vol: vols[king],
                isA2: true,
                A2,
                A2Start,
                A2Stop,
                A2Speed,
                A2Vol: vols[prince],
                Comment: "King " + king + " with voiceover " + prince + ".",
              });
              thePlan.push(
                msIndex.toString() +
                  " A1: " +
                  A1 +
                  ", V1: " +
                  V1 +
                  ", A2: " +
                  A2
              );
            } else {
              // If no voiceover clip, play original
              if (!dup) {
                // I only want to do this if I didn't just play source.
                theCode.push({
                  V1,
                  V1Start,
                  V1Stop,
                  V1Speed,
                  A1,
                  A1Start,
                  A1Stop,
                  A1Speed,
                  A1Vol: vols[king],
                  isA2: false,
                  Comment:
                    "King " +
                    king +
                    " with source (no voiceover " +
                    prince +
                    ").",
                });
                thePlan.push(msIndex.toString() + " A1: " + A1 + ", V1: " + V1);
                dup = true;
              }
            }
          }
          if (prince === 2) {
            const thisData = getAudio("TranslationMerged", ms);
            if (thisData.file !== "") {
              A2 = thisData.file;
              A2Start = thisData.start;
              A2Stop = thisData.stop;
              A2Speed = kingLen / (A2Stop - A2Start);
            }
            if (A2 !== "") {
              theCode.push({
                V1,
                V1Start,
                V1Stop,
                V1Speed,
                A1,
                A1Start,
                A1Stop,
                A1Speed,
                A1Vol: vols[king],
                isA2: true,
                A2,
                A2Start,
                A2Stop,
                A2Speed,
                A2Vol: vols[prince],
                Comment: "King " + king + " with voiceover " + prince + ".",
              });
              thePlan.push(
                msIndex.toString() +
                  " A1: " +
                  A1 +
                  ", V1: " +
                  V1 +
                  ", A2: " +
                  A2
              );
            } else {
              if (!dup) {
                // Avoid duplicates. I only want to run this if we didn't do the same for the careful speech or source.
                theCode.push({
                  V1,
                  V1Start,
                  V1Stop,
                  V1Speed,
                  A1,
                  A1Start,
                  A1Stop,
                  A1Speed,
                  A1Vol: vols[king],
                  isA2: false,
                  Comment:
                    "King " +
                    king +
                    " with source (no voiceover " +
                    prince +
                    ").",
                });
                thePlan.push(msIndex.toString() + " A1: " + A1 + ", V1: " + V1);
              }
            }
          }
        });
      } else {
        //No Voiceovers
        if (A1 !== "") {
          // Push V1 and A1 with no voiceover
          theCode.push({
            V1,
            V1Start,
            V1Stop,
            V1Speed,
            A1,
            A1Start,
            A1Stop,
            A1Speed,
            A1Vol: vols[king],
            isA2: false,
            Comment: "King " + king + ".",
          });
          thePlan.push(msIndex.toString() + " A1: " + A1 + ", V1: " + V1);
        } else {
          // If King has no clip, play source.
          A1 = vidSource;
          A1Speed = multiplier;
          A2Start = V1Start;
          A2Stop = V1Stop;
          A2Speed = multiplier;
          theCode.push({
            V1,
            V1Start,
            V1Stop,
            V1Speed,
            A1,
            A1Start: ms.startTime,
            A1Stop: ms.stopTime,
            A1Speed,
            A1Vol: vols[king],
            isA2: false,
            Comment: "King " + king + " has no clip, playing source.",
          });
          thePlan.push(msIndex.toString() + " A1: " + A1 + ", V1: " + V1);
        }
      }
    });
  });
  console.log(thePlan);
  buildVideo(theCode, outputPath);

  /*
  For Each Milestone:

    King Round
    ---
    A1: WS[King], Start-Time, Stop-Time, Mult, Vol.
        KingLen = (KingStop-KingStart)*Mult
    V1: VID, Start-Time, Stop-Time, VidMult, Vol
        VidMult = KingLen/(VidStop-VidStart)
    A2: VO1, Start-Time, Stop-time, VO1Mult, Vol. 
        VOMult = KingLen/(VOStop-VOStart)
    Push and Burn Subtitle for King
    If Overlay: 
        Title of WS[King]
    Push Encoding String

    If Pause
        Insert Pause
    If Prince2 >= 0
        Prince Round 1:
        ---
        A1: WS[PRINCE1], Start-Time, Stop-Time, Mult, Vol.
            KingLen = (PrinceStop-PrinceStart)*Mult
        V1: VID, Start-Time, Stop-Time, VidMult, Vol
            VidMult = PrinceLen/(VidStart-VidStop)
        A2: VO1, Start-Time, Stop-time, VO1Mult, Vol. 
            VOMult = PrinceLen/(VidStart-VidStop)
        Push and Burn Subtitle for Prince1
        If Overlay: 
            Title of WS[Prince2]
        Push Encoding String
    If Pause
        Insert Pause
    If Prince2 >= 0
        Prince Round 2:
        ---
        A1: WS[PRINCE2], Start-Time, Stop-Time, Mult, Vol.
            KingLen = (PrinceStop-PrinceStart)*Mult
        V1: VID, Start-Time, Stop-Time, VidMult, Vol
            VidMult = PrinceLen/(VidStart-VidStop)
        A2: VO1, Start-Time, Stop-time, VO1Mult, Vol. 
            VOMult = PrinceLen/(VidStart-VidStop)
        Push and Burn Subtitle for Prince2
        If Overlay: 
            Title of WS[Prince2]
        Push Encoding String
    If Pause
        Insert Pause
  After Collection:
    Merge Encoding String into one and run.
  */
  return true;
}

function buildVideo(inData: LooseObject, outputPath: string) {
  const ffmpegStaticElectron = require("ffmpeg-static-electron");
  const ffprobeStaticElectron = require("ffprobe-static-electron");

  // Set Up Fluent FFMpeg and its Associated Paths
  const fluentFfmpeg = require("fluent-ffmpeg");
  if (require("electron-is-dev")) {
    fluentFfmpeg.setFfmpegPath(`${process.cwd()}\\bin\\win\\x64\\ffmpeg.exe`);
    fluentFfmpeg.setFfprobePath(`${process.cwd()}\\bin\\win\\x64\\ffprobe.exe`);
  } else {
    fluentFfmpeg.setFfmpegPath(
      `${process.cwd()}/resources${ffmpegStaticElectron.path}`
    );
    fluentFfmpeg.setFfprobePath(
      `${process.cwd()}/resources${ffprobeStaticElectron.path}`
    );
  }
  const mv = fluentFfmpeg();
  let inputtedInputs = -1;
  let cf = "";
  let cfNote = "";
  inData.forEach((clip: LooseObject, cIndex: number) => {
    const numClips = inData.length;
    let v1Idx = 0;
    let a1Idx = 0;
    let a2Idx = 0;
    // Video
    mv.addInput(deBlobWin(clip.V1));
    inputtedInputs += 1;
    v1Idx = inputtedInputs;
    mv.inputOptions(["-ss " + clip.V1Start, "-to " + clip.V1Stop]);
    // mv.videoFilters(["setPTS=" + clip.V1Speed + "*PTS"]);
    // A1
    mv.addInput(deBlobWin(clip.A1));
    inputtedInputs += 1;
    a1Idx = inputtedInputs;
    mv.inputOptions(["-ss " + clip.A1Start, "-to " + clip.A1Stop]);
    let a1Filter = "";
    let a1Speed = clip.A1Speed;
    if (a1Speed > 2) {
      a1Filter = "atempo=2.0,";
      a1Speed = a1Speed - 1;
      if (a1Speed > 2) {
        a1Filter += "atempo=2.0,";
        a1Speed = a1Speed - 1;
      }
    }
    a1Filter += "atempo=" + a1Speed;
    let a2Filter = "";
    let a2Speed = -1;
    // A2
    if (clip.isA2) {
      mv.addinput(deBlobWin(clip.A2));
      inputtedInputs += 1;
      a2Idx = inputtedInputs;
      mv.inputOptions(["-ss " + clip.A2Start, "-to " + clip.A2Stop]);
      a2Speed = clip.A2Speed;
      if (a2Speed > 2) {
        let a2Filter = "atempo=2.0,";
        a2Speed = a2Speed - 1;
        if (a2Speed > 2) {
          a2Filter += "atempo=2.0,";
          a2Speed = a2Speed - 1;
        }
      }
      a2Filter += "atempo=" + a2Speed;
    } else {
      //mv.addInput(process.cwd() + "/public/silence.wav");
    }
    // Longest??
    console.log("Pause");
    cfNote = "Round" + cIndex.toString() + ":";
    // Make this ++ to log
    if (a2Idx !== 0) {
      cfNote +=
        "With A2, V1-[" +
        v1Idx.toString() +
        "], A1-[" +
        a1Idx.toString() +
        "], A2-[" +
        a1Idx.toString() +
        "];";
      // Add cf writer here, too
    } else {
      // Simple case, no A2
      cfNote +=
        "Without A2, V1-[" +
        v1Idx.toString() +
        "], A1-[" +
        a1Idx.toString() +
        "]";
      if (cIndex === 0) {
        // First round
        cf += "[" + v1Idx.toString() + ":v][" + a1Idx.toString() + ":a]";
      } else if (cIndex === numClips) {
        // Last Round
        if (cIndex !== 1) {
          cf += "[outv:v][outa:a]";
        }
        cf +=
          "[" +
          v1Idx.toString() +
          ":v][" +
          a1Idx.toString() +
          ":a]concat=n=2:v=1:a=1[outv][outa];";
        // cf += '-map "[outv]" -map "[outa]"';
      } else {
        // Middle Rounds
        if (cIndex !== 1) {
          cf += "[outv:v][outa:a]";
        }
        cf +=
          "[" +
          v1Idx.toString() +
          ":v][" +
          a1Idx.toString() +
          ":a]concat=n=2:v=1:a=1[outv][outa];";
      }
    }
    console.log("Pause");
  });
  const outputURI =
    outputPath.substring(0, outputPath.lastIndexOf(".")) + "_Compiled.mp4";
  const outputOSPath = deBlobWin(outputURI);
  // Convert and Save File
  mv.complexFilter(cf)
    .format("mp4")
    .videoBitrate("1024k")
    .videoCodec("mpeg4")
    //.size("720x?")
    .audioBitrate("128k")
    .audioChannels(2)
    .audioCodec("libmp3lame")
    .outputOptions("-y")
    .on("start", (command: any) => {
      console.log("ffmpeg process started:", command);
      //this.sendSnackbar("Converting Source Audio.");
    })
    .on("error", (err: any) => {
      console.log("An error occurred: " + err.message);
      //this.sendSnackbar("An error occurred: " + err.message);
    })
    .on("end", () => {
      console.log("Video Export finished!");
      //this.sendSnackbar("Source Audio Converted.");
    })
    .save(outputOSPath);
}

export function getAudio(chan: string, ms: LooseObject) {
  let audioFile = "";
  let audioStart = -1;
  let audioStop = -1;
  ms.data.forEach((d: LooseObject) => {
    if (d.channel === chan) {
      audioFile = d.data;
      audioStart = d.clipStart;
      audioStop = d.clipStop;
    }
  });
  return { file: audioFile, start: audioStart, stop: audioStop };
}

export function deBlobWin(blob: string): string {
  const path = require("path");
  const p = path.parse(blob.toString());
  let target = p.dir.substring(8) + path.sep + p.base;
  target = decodeURI(target);
  const re = /\//gi;
  target = '"' + target.replace(re, "\\") + '"';
  //target = target.replace("file:\\\\", "");
  // target = target.replaceAll("/", path.sep);
  return target;
}
