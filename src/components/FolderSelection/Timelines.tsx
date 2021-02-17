import { LooseObject } from "../../store/annot/types";

const timeline: LooseObject = {};

export class Timelines {
  public readonly timeline: LooseObject = timeline;
  constructor(sources: LooseObject) {
    timeline.instantiated = true;
    timeline.syncMedia = sources.syncMedia;
    timeline.eafFile = sources.eafFile;
    timeline.milestones = [];
  }

  // Adds Passed Milestone to the Timeline
  public addMilestone(newMilestone: LooseObject): void {
    // Push to Existing Milestone Data if Times Match
    // Otherwise, Push Whole Milestone to Timeline
    let dup = false;
    for (let m = 0, l = timeline.milestones.length; m < l; m++) {
      const currMil = timeline.milestones[m];
      if (
        currMil.startTime === newMilestone.startTime &&
        currMil.stopTime === newMilestone.stopTime
      ) {
        dup = true;
        newMilestone.data.forEach((annot: LooseObject) =>
          currMil.data.push(annot)
        );
      }
    }
    if (!dup) timeline.milestones.push(newMilestone);
  }

  public countMilestones(): number {
    // need to handle multiple instances
    return timeline.milestones.length();
  }
  public addEAFToIndex(index: number, filelist: string[]): void {
    for (let f = 0, l = filelist.length; f < l; f++)
      if (timeline[index]["filename"].indexOf(filelist[f]) === -1)
        timeline.eaf.push(filelist[f]);
  }
  public addMediaToIndex(index: number, filelist: string[]): void {
    for (let f = 0, l = filelist.length; f < l; f++)
      if (timeline[index]["filename"].indexOf(filelist[f]) === -1)
        timeline.syncedMedia.push(filelist[f]);
  }
  public getIndexOfMedia(filelist: string[]): number {
    let found = false;
    let foundIndex = -1;
    for (let f = 0, l = filelist.length; f < l; f++) {
      let m;
      for (m = 0; m < timeline.length; m++) {
        if (timeline[m]["filename"].indexOf(filelist[m]) > -1) {
          found = true;
          foundIndex = m;
        }
      }
      if (!found) {
        return -1;
      }
      if (found) {
        return foundIndex;
      }
    }
    return foundIndex;
  }
}

export default Timelines;
