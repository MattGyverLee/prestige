import Timelines from "./timeline";

export default function processEAF(
  path: string,
  props: any
) {
  // Define Content
  let content: any = "";
  const file = require("fs-extra").readFileSync(path);
  require("xml2js").parseString(file, function(err: Error, result: any) {
    if (err) {
      console.log(err.stack);
    }
    content = result;
  });

  // Miscellaneous Local Variables
  const fileData = content.ANNOTATION_DOCUMENT;
  const timeSlotPointer = fileData.TIME_ORDER[0].TIME_SLOT;
  let g, h, i, j, k;
  const miles: any[] = [];

  // Define Instance Variables for tempTimeline
  const parsedPath = require("path").parse(path);
  const eafFile: string = parsedPath.base;
  const syncMedia: string[] = [];
  for (h = 0; h < fileData.HEADER[0].MEDIA_DESCRIPTOR.length; h++) {
    const refMedia = fileData.HEADER[0].MEDIA_DESCRIPTOR[h].$.MEDIA_URL;
    for (g = 0; g < props.tree.availableMedia.length; g++) {
      if (props.tree.availableMedia[g].name === refMedia) {
        // toDo: Do this right with Redux
        props.tree.availableMedia[g]["hasAnnotation"] = true;
        props.tree.availableMedia[g]["annotationRef"] = path;
      }
    }
    syncMedia.push(refMedia);
  }

  // Instantiate tempTimeline
  let tempTimeline = new Timelines({
    refName: parsedPath.name,
    syncMedia: { syncMedia },
    eafFile: { eafFile }
  });

  // Inline Function Definition for findTime and findAnnotTime
  const findTime = (myRef: string) => {
    let time = -1;
    for (i = 0; i < timeSlotPointer.length; i++) {
      if (timeSlotPointer[i].$.TIME_SLOT_ID === myRef) {
        time = timeSlotPointer[i].$.TIME_VALUE;
        return time;
      }
    }
    return time;
  };
  const findAnnotTime = (myRef4: any, startStop: string) => {
    let time = -1;
    for (i = 0; i < miles.length; i++) {
      if (miles[i]["annotationID"] === myRef4) {
        time = miles[i][startStop];
        return time;
      }
    }
    return time;
  };

  // Process All of File's Annotations
  for (j = 0; j < fileData.TIER.length; j++) {
    // Verify Current lingType is a Category and Add if Otherwise
    const lingType = fileData.TIER[j].$.LINGUISTIC_TYPE_REF + "_text";
    if (props.annotations.categories.indexOf(lingType) === -1) {
      props.addCategory(lingType);
    }

    // Process Annotations
    for (k = 0; k < fileData.TIER[j].ANNOTATION.length; k++) {
      // Process Alignable Annotations
      if ("ALIGNABLE_ANNOTATION" in fileData.TIER[j].ANNOTATION[k]) {
        // Find Start/Stop Times for Annotation by Counting Id
        const alAnnPointer = fileData.TIER[j].ANNOTATION[k].ALIGNABLE_ANNOTATION[0];
        const thisStartTime: number = findTime(alAnnPointer.$.TIME_SLOT_REF1);
        const thisStopTime: number = findTime(alAnnPointer.$.TIME_SLOT_REF2);

        // Grab Annotation Reference if the Line Has One
        let annotationRef = "";
        if (alAnnPointer.$.ANNOTATION_REF !== undefined) {
          annotationRef = alAnnPointer.$.ANNOTATION_REF;
        }

        // Define Milestone for Current Annotation, Push to Miles, and Add to tempTimeline
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
        tempTimeline.addMilestone(milestone);
      }

      // Process REF Annotations
      if ("REF_ANNOTATION" in fileData.TIER[j].ANNOTATION[k]) {
        const refAnnPointer = fileData.TIER[j].ANNOTATION[k].REF_ANNOTATION[0];
        // Only Process Annotation if it Has Actual Text
        if (refAnnPointer.ANNOTATION_VALUE[0] !== "") {
          // Find Start/Stop Times for Annotations
          const annotStartTime = findAnnotTime(refAnnPointer.$.ANNOTATION_REF, "startTime");
          const annotStopTime = findAnnotTime(refAnnPointer.$.ANNOTATION_REF, "stopTime");

          // Define Milestone for Current Annotation, Push to Miles, and Add to tempTimeline
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
          tempTimeline.addMilestone(milestone2);
        }
      }
    }
  }

  // Assign tempTimeline an Annotaiton Index and Push to Timeline
  // Todo: is this ASYNC Safe?
  let annotationIndex = 0;
  if (props.annotations.timeline !== undefined) {
    annotationIndex = props.annotations.timeline.length;
  }
  tempTimeline.timeline["annotationID"] = annotationIndex;
  props.pushTimeline(tempTimeline);
  console.log("EAF Processed");

  // TODO: FormatTimeline
  // props.formatTimeline(path);
}
