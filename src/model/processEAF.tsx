import { LooseObject } from "../store/annotations/types";
import Timelines from "./timeline";

export default function processEAF(
  path: string,
  // parentThis: any,
  props: any
) {
  const fs = require("fs-extra");
  const parseString = require("xml2js").parseString;
  let content: any = "";
  const file = fs.readFileSync(path);
  parseString(file, function(err: Error, result: any) {
    content = result;
  });
  const fileData = content.ANNOTATION_DOCUMENT;
  const timeSlotPointer = fileData.TIME_ORDER[0].TIME_SLOT;
  let g, h, i, j, k;
  const pathParse = require("path");
  const parsedPath = pathParse.parse(path);
  const miles: any[] = [];
  let whichTimeline = {};
  let tempTimeline: LooseObject = { timeline: [{ instantiated: false }] };
  const syncMedia: string[] = [];
  const eafFile: string = parsedPath.base;
  // Defines Refmedia
  for (h = 0; h < fileData.HEADER[0].MEDIA_DESCRIPTOR.length; h++) {
    const refMedia = fileData.HEADER[0].MEDIA_DESCRIPTOR[h].$.MEDIA_URL;
    for (g = 0; g < props.tree.availableMedia.length; g++) {
      if (props.tree.availableMedia[g].name === refMedia) {
        // toDo: Do this right with Promise
        props.tree.availableMedia[g]["hasAnnotation"] = true;
        props.tree.availableMedia[g]["annotationRef"] = path;
      }
    }
    syncMedia.push(refMedia);
  }
  // Instantiate Timeline if needed

  whichTimeline = {
    refName: parsedPath.name,
    syncMedia: { syncMedia },
    eafFile: { eafFile }
  };
  let annotationIndex = -1;
  // todo: This seems unsafe

  tempTimeline = new Timelines(whichTimeline);
  const findStartTime = (myRef: string) => {
    let startTime = -1;
    for (i = 0; i < timeSlotPointer.length; i++) {
      if (timeSlotPointer[i].$.TIME_SLOT_ID === myRef) {
        startTime = timeSlotPointer[i].$.TIME_VALUE;
        return startTime;
      }
    }
    return startTime;
  };
  const findStopTime = (myRef2: string) => {
    let stopTime = -1;
    for (i = 0; i < timeSlotPointer.length; i++) {
      if (timeSlotPointer[i].$.TIME_SLOT_ID === myRef2) {
        stopTime = timeSlotPointer[i].$.TIME_VALUE;
        console.log(stopTime);
        return stopTime;
      }
    }
    return stopTime;
  };
  // First Pass:
  // Main Annotation
  for (j = 0; j < fileData.TIER.length; j++) {
    const lingType = fileData.TIER[j].$.LINGUISTIC_TYPE_REF + "_text";
    if (
      props.annotations.categories.indexOf(lingType) === -1
      // Todo: Clean up duplication here
    ) {
      props.addCategory(fileData.TIER[j].$.LINGUISTIC_TYPE_REF + "_text");
    }
    for (k = 0; k < fileData.TIER[j].ANNOTATION.length; k++) {
      if ("ALIGNABLE_ANNOTATION" in fileData.TIER[j].ANNOTATION[k]) {
        const alAnnPointer =
          fileData.TIER[j].ANNOTATION[k].ALIGNABLE_ANNOTATION[0];

        // need to count id's
        const thisStartTime: number = findStartTime(
          alAnnPointer.$.TIME_SLOT_REF1
        );
        const thisStopTime: number = findStopTime(
          alAnnPointer.$.TIME_SLOT_REF2
        );
        // let annotationRef = "";
        let annotationRef = "";
        if (alAnnPointer.$.ANNOTATION_REF !== undefined) {
          annotationRef = alAnnPointer.$.ANNOTATION_REF;
        }
        const milestone = {
          alignable: false,
          annotationID: alAnnPointer.$.ANNOTATION_ID,
          annotationRef: { annotationRef },
          data: [
            {
              channel: fileData.TIER[j].$.TIER_ID,
              linguisticType: fileData.TIER[j].$.LINGUISTIC_TYPE_REF + "_text",
              data: alAnnPointer.ANNOTATION_VALUE[0],
              locale: fileData.TIER[j].$.DEFAULT_LOCALE,
              mimeType: "string"
            }
          ],
          startTime: thisStartTime / 1000,
          startId: alAnnPointer.$.TIME_SLOT_REF1,
          stopTime: thisStopTime / 1000,
          stopId: alAnnPointer.$.TIME_SLOT_REF2,
          timeline: parsedPath.base
        };

        miles.push(milestone);
        tempTimeline.addMilestone(annotationIndex, milestone);
      }

      // REF Annotation

      if ("REF_ANNOTATION" in fileData.TIER[j].ANNOTATION[k]) {
        const refAnnPointer = fileData.TIER[j].ANNOTATION[k].REF_ANNOTATION[0];
        if (refAnnPointer.ANNOTATION_VALUE[0] !== "") {
          /*             let tier3 = fileData.TIER[j].$.LINGUISTIC_TYPE_REF + "_text";
            if (parentThis.category.indexOf(tier3) == -1) {
              parentThis.category = [...parentThis.category, tier3];
            } */

          const findAnnotStart = (myRef3: string) => {
            let startTime = -1;
            let i;
            for (i = 0; i < miles.length; i++) {
              if (miles[i]["annotationID"] === myRef3) {
                startTime = miles[i]["startTime"];
                return startTime;
              }
            }
            return startTime;
          };

          const findAnnotStop = (myRef4: any) => {
            let i;
            let stopTime = -1;
            for (i = 0; i < miles.length; i++) {
              if (miles[i]["annotationID"] === myRef4) {
                stopTime = miles[i]["stopTime"];
                return stopTime;
              }
            }
            return stopTime;
          };

          const annotStartTime = findAnnotStart(refAnnPointer.$.ANNOTATION_REF);
          const annotStopTime = findAnnotStop(refAnnPointer.$.ANNOTATION_REF);

          const milestone2 = {
            alignable: false,
            annotationID: refAnnPointer.$.ANNOTATION_ID,
            data: [
              {
                channel: fileData.TIER[j].$.LINGUISTIC_TYPE_REF,
                data: refAnnPointer.ANNOTATION_VALUE[0],
                linguisticType: fileData.TIER[j].$.TIER_ID + "_text",
                locale: fileData.TIER[j].$.DEFAULT_LOCALE,
                mimeType: "string"
              }
            ],
            startId: refAnnPointer.$.TIME_SLOT_REF1,
            startTime: annotStartTime,
            stopId: refAnnPointer.$.TIME_SLOT_REF2,
            stopTime: annotStopTime,
            timeLine: parsedPath.base
          };
          miles.push(milestone2);

          /*             let tier2 = fileData.TIER[j].$.LINGUISTIC_TYPE_REF + "_text";
            if (parentThis.category.indexOf(tier2) == -1) {
              parentThis.category = [...parentThis.category, tier2];
            } */
          tempTimeline.addMilestone(annotationIndex, milestone2);
        }
      }
    }
  }

  // Final Actions
  // test = tempTimeline["timeline"][0]["instantiated"];
  // Todo: is this ASYNC Safe?
  if (props.annotations.timeline !== undefined) {
    annotationIndex = props.annotations.timeline.length;
  } else {
    annotationIndex = 0;
  }

  tempTimeline.timeline["annotationID"] = annotationIndex;
  props.pushTimeline(tempTimeline);

  // this.setState({ category: parentThis.category });
  // -----------------------------------------
  // this.state.rawAnnotationLoaded = true;
  console.log("Pause Here");

  // TODO: FormatTimeline
  // this.formatTimeline(path);
}
