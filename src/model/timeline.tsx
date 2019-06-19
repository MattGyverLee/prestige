//timeline
import { LooseObject } from "../store/annotations/types";

var timeline: LooseObject = {};
var nextId = 0;

export class Timelines {
  public readonly timeline: LooseObject = timeline;
  constructor(sources: LooseObject) {
    timeline["instantiated"] = true;
    timeline["refName"] = sources["refname"];
    timeline["syncMedia"] = sources["syncMedia"];
    timeline["eafFile"] = sources["eafFile"];
    timeline["milestones"] = [];
  }
  //add functions here
  public addMilestone(index: number, newMilestone: LooseObject) {
    var m: number;
    var dup: boolean = false;
    const pushMilestones = (
      newstones: LooseObject,
      outArray: Array<LooseObject>
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
        //alert("Dup!")
        dup = true;
        //Todo Test Dups
        if ("annotationID" in newMilestone) {
          timeline["milestones"][m]["annotationID"] =
            newMilestone["annotationID"];
        }
        //todo: solve this rather than hiding it.
        pushMilestones(newMilestone["data"], timeline["milestones"][m]["data"]);
      }
    }
    if (!dup) {
      newMilestone["id"] = this.getNextAnnotRef(0); //todo the 0 is temporary
      timeline["milestones"].push(newMilestone);
      nextId += 1;
    }

    //alert("pushed milestone")
  }

  public countMilestones(): number {
    // need to handle multiple instances
    return timeline["milestones"].length();
  }
  public getNextAnnotRef(index: number): number {
    // need to handle multiple instances
    return nextId;
  }
  public addEAFToIndex(index: number, filelist: Array<string>) {
    var f;
    for (f = 0; f < filelist.length; f++) {
      if (timeline[index]["filename"].indexOf(filelist[f]) === -1) {
        timeline["eaf"].push(filelist[f]);
      }
    }
  }
  public addMediaToIndex(index: number, filelist: Array<string>) {
    var f;
    for (f = 0; f < filelist.length; f++) {
      if (timeline[index]["filename"].indexOf(filelist[f]) === -1) {
        timeline["syncedMedia"].push(filelist[f]);
      }
    }
  }
  public getIndexOfMedia(filelist: Array<string>): number {
    var found = false;
    var foundIndex = -1;
    var f;
    for (f = 0; f < filelist.length; f++) {
      var m;
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
