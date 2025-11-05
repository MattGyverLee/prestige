import { LooseObject } from "../../store/annot/types";
import { electronAPI } from "../../utils/electronAPI";
import toast from "react-hot-toast";

/**
 * Export video with multilingual audio tracks
 *
 * This function analyzes the timeline and volume settings to build video clips
 * with synchronized audio tracks. It categorizes audio sources as:
 * - Kings: Primary audio (volume >= 0.7)
 * - Princes: Background/voiceover audio (0 < volume < 0.7)
 *
 * For each milestone, it creates clips with:
 * - Video at calculated speed
 * - Primary audio (king)
 * - Optional secondary audio (prince/voiceover)
 */
export async function exportVideo(
  timeline: LooseObject,
  multiplier: number,
  vols: number[]
): Promise<boolean> {
  try {
    const kings: number[] = [];
    const princes: number[] = [];

    // Categorize audio tracks by volume
    vols.forEach((vol: number, index: number) => {
      if (vol >= 0.7) {
        kings.push(index);
      } else if (vol > 0) {
        princes.push(index);
      }
    });

    const vidSource = timeline.syncMedia[0];
    const audSource = timeline.syncMedia[1];
    const clips: LooseObject[] = [];

    toast.loading("Building export plan...", { id: "export-video" });

    // Build clip objects for each milestone
    timeline.milestones.forEach((ms: LooseObject, msIndex: number) => {
      const V1 = vidSource;
      const V1Start = ms.startTime;
      const V1Stop = ms.stopTime;
      let V1Speed = -1;

      let A1 = "";
      let A1Start = -1;
      let A1Stop = -1;
      let A1Speed = -1;

      let A2 = "";
      let A2Start = -1;
      let A2Stop = -1;
      let A2Speed = -1;

      kings.forEach((king: number) => {
        let kingLen = -1;

        // Determine primary audio source based on king track
        if (king === 0) {
          // Use video's audio at multiplier speed
          A1 = vidSource;
          A1Speed = multiplier;
          A1Start = ms.startTime;
          A1Stop = ms.stopTime;
          kingLen = (ms.stopTime - ms.startTime) * multiplier;
          V1Speed = multiplier;
        } else if (king === 1) {
          // Use CarefulMerged annotation audio
          const thisData = getAudio("CarefulMerged", ms);
          if (thisData.file !== "") {
            A1 = thisData.file;
            A1Start = thisData.start;
            A1Stop = thisData.stop;
            kingLen = (A1Stop - A1Start) * multiplier;
            V1Speed = kingLen / (ms.stopTime - ms.startTime);
          }
        } else if (king === 2) {
          // Use TranslationMerged annotation audio
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

        // Add voiceover tracks (princes)
        if (princes.length > 0) {
          princes.forEach((prince: number) => {
            if (prince === 0) {
              // Use audio source as background
              A2 = audSource;
              A2Start = V1Start;
              A2Stop = V1Stop;
              A2Speed = V1Speed;

              clips.push({
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
                Comment: `Milestone ${msIndex}: King ${king} with voiceover ${prince}`,
              });
              dup = true;
            }

            if (prince === 1) {
              // Use CarefulMerged as voiceover
              const thisData = getAudio("CarefulMerged", ms);
              if (thisData.file !== "") {
                A2 = thisData.file;
                A2Start = thisData.start;
                A2Stop = thisData.stop;
                A2Speed = kingLen / (A2Stop - A2Start);

                clips.push({
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
                  Comment: `Milestone ${msIndex}: King ${king} with voiceover ${prince}`,
                });
              } else if (!dup) {
                // No voiceover available, use primary only
                clips.push({
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
                  Comment: `Milestone ${msIndex}: King ${king} (no voiceover ${prince})`,
                });
                dup = true;
              }
            }

            if (prince === 2) {
              // Use TranslationMerged as voiceover
              const thisData = getAudio("TranslationMerged", ms);
              if (thisData.file !== "") {
                A2 = thisData.file;
                A2Start = thisData.start;
                A2Stop = thisData.stop;
                A2Speed = kingLen / (A2Stop - A2Start);

                clips.push({
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
                  Comment: `Milestone ${msIndex}: King ${king} with voiceover ${prince}`,
                });
              } else if (!dup) {
                // No voiceover available, use primary only
                clips.push({
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
                  Comment: `Milestone ${msIndex}: King ${king} (no voiceover ${prince})`,
                });
              }
            }
          });
        } else {
          // No voiceovers, just use primary audio
          if (A1 !== "") {
            clips.push({
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
              Comment: `Milestone ${msIndex}: King ${king}`,
            });
          } else {
            // King has no clip, use source
            clips.push({
              V1,
              V1Start,
              V1Stop,
              V1Speed: multiplier,
              A1: vidSource,
              A1Start: ms.startTime,
              A1Stop: ms.stopTime,
              A1Speed: multiplier,
              A1Vol: vols[king],
              isA2: false,
              Comment: `Milestone ${msIndex}: King ${king} fallback to source`,
            });
          }
        }
      });
    });

    console.log(`Built ${clips.length} clips for export`);
    console.log(clips);

    // Get output path from user
    const outputPath = await electronAPI.getCwd() + "/export-" + Date.now() + ".mp4";

    toast.loading(`Exporting ${clips.length} clips...`, { id: "export-video" });

    // Call IPC method to execute ffmpeg export
    const result = await electronAPI.exportVideo(clips, outputPath);

    toast.success(`Video exported successfully to ${result.output}`, { id: "export-video" });

    return true;
  } catch (error) {
    console.error("Export video error:", error);
    toast.error(`Export failed: ${(error as Error).message}`, { id: "export-video" });
    return false;
  }
}

/**
 * Helper function to find audio clip data for a given channel in a milestone
 */
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
