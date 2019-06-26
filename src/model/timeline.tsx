import { LooseObject } from "../store/annotations/types";

const timeline: LooseObject = {};
let nextId = 0;

export class Timelines {
  public readonly timeline: LooseObject = timeline;
  constructor(sources: LooseObject) {
    timeline["instantiated"] = true;
    timeline["refName"] = sources["refname"];
    timeline["syncMedia"] = sources["syncMedia"];
    timeline["eafFile"] = sources["eafFile"];
    timeline["milestones"] = [];
  }
  // add functions here
  public addMilestone(newMilestone: LooseObject) {
    let m: number;
    let dup = false;
    const pushMilestones = (
      newstones: LooseObject,
      outArray: LooseObject[]
    ) => {
      newstones.forEach((annot: LooseObject) => {
        outArray.push(annot);
      });
    };
    for (m = 0; m < timeline["milestones"].length; m++) {
      if (
        timeline["milestones"][m]["startTime"] === newMilestone["startTime"] &&
        timeline["milestones"][m]["stopTime"] === newMilestone["stopTime"]
      ) {
        dup = true;
        /*
        if ("annotationID" in newMilestone) {
          timeline["milestones"][m]["annotationID"] =
            newMilestone["annotationID"];
        }
        */
        pushMilestones(newMilestone["data"], timeline["milestones"][m]["data"]);
      }
    }
    if (!dup) {
      newMilestone["id"] = nextId;
      timeline["milestones"].push(newMilestone);
      nextId += 1;
    }
  }

  public countMilestones(): number {
    // need to handle multiple instances
    return timeline["milestones"].length();
  }
  public addEAFToIndex(index: number, filelist: string[]) {
    let f;
    for (f = 0; f < filelist.length; f++) {
      if (timeline[index]["filename"].indexOf(filelist[f]) === -1) {
        timeline["eaf"].push(filelist[f]);
      }
    }
  }
  public addMediaToIndex(index: number, filelist: string[]) {
    let f;
    for (f = 0; f < filelist.length; f++) {
      if (timeline[index]["filename"].indexOf(filelist[f]) === -1) {
        timeline["syncedMedia"].push(filelist[f]);
      }
    }
  }
  public getIndexOfMedia(filelist: string[]): number {
    let found = false;
    let foundIndex = -1;
    let f;
    for (f = 0; f < filelist.length; f++) {
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
