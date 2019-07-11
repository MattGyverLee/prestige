import Timelines from "./timeline";

export default function processEAF(path: string, props: any) {
  // Define Content
  let content: any = "";
  require("xml2js").parseString(
    require("fs-extra").readFileSync(path),
    function(err: Error, result: any) {
      if (err) {
        console.log(err.stack);
      }
      content = result;
    }
  );

  // Miscellaneous Local Variables
  const fileData = content.ANNOTATION_DOCUMENT;
  const timeSlotPointer = fileData.TIME_ORDER[0].TIME_SLOT;
  const miles: any[] = [];

  // Define SyncMedia for tempTimeline
  const parsedPath = require("path").parse(path);
  const fileURL = require("file-url");
  const syncMedia: string[] = [];
  for (let h = 0, l = fileData.HEADER[0].MEDIA_DESCRIPTOR.length; h < l; h++)
    syncMedia.push(
      fileURL(
        parsedPath.dir +
          "/" +
          fileData.HEADER[0].MEDIA_DESCRIPTOR[h].$.MEDIA_URL
      )
    );

  // Instantiate tempTimeline
  let tempTimeline = new Timelines({
    syncMedia: syncMedia,
    eafFile: fileURL(path)
  });

  // Inline Function Definition for findTime and findAnnotTime
  const findTime = (myRef: string) => {
    for (let i = 0, l = timeSlotPointer.length; i < l; i++)
      if (timeSlotPointer[i].$.TIME_SLOT_ID === myRef)
        return timeSlotPointer[i].$.TIME_VALUE;
    return -1;
  };
  const findAnnotTime = (myRef4: any, startStop: string) => {
    for (let i = 0, l = miles.length; i < l; i++)
      if (miles[i]["annotationID"] === myRef4) return miles[i][startStop];
    return -1;
  };

  // Process All of File's Annotations
  for (let j = 0, l = fileData.TIER.length; j < l; j++) {
    // Verify Current lingType is a Category and Add if Otherwise
    const lingType = fileData.TIER[j].$.LINGUISTIC_TYPE_REF + "_text";
    if (props.annotations.categories.indexOf(lingType) === -1)
      props.addCategory(lingType);

    // Process Annotations
    for (let k = 0, l2 = fileData.TIER[j].ANNOTATION.length; k < l2; k++) {
      // Process Alignable Annotations or Ref Annotations
      if ("ALIGNABLE_ANNOTATION" in fileData.TIER[j].ANNOTATION[k]) {
        // Define Milestone for Current Annotation, Push to Miles, and Add to tempTimeline
        const alAnnPointer =
          fileData.TIER[j].ANNOTATION[k].ALIGNABLE_ANNOTATION[0];
        const milestone = {
          annotationID: alAnnPointer.$.ANNOTATION_ID,
          data: [
            {
              channel: fileData.TIER[j].$.TIER_ID,
              linguisticType: fileData.TIER[j].$.LINGUISTIC_TYPE_REF + "_text",
              data: alAnnPointer.ANNOTATION_VALUE[0],
              locale: fileData.TIER[j].$.DEFAULT_LOCALE,
              mimeType: "string"
            }
          ],
          startTime: findTime(alAnnPointer.$.TIME_SLOT_REF1) / 1000,
          startId: alAnnPointer.$.TIME_SLOT_REF1,
          stopTime: findTime(alAnnPointer.$.TIME_SLOT_REF2) / 1000,
          stopId: alAnnPointer.$.TIME_SLOT_REF2,
          timeline: parsedPath.base
        };
        miles.push(milestone);
        tempTimeline.addMilestone(milestone);
      } else if ("REF_ANNOTATION" in fileData.TIER[j].ANNOTATION[k]) {
        const refAnnPointer = fileData.TIER[j].ANNOTATION[k].REF_ANNOTATION[0];
        // Only Process Annotation if it Has Actual Text
        if (refAnnPointer.ANNOTATION_VALUE[0] !== "") {
          // Define Milestone for Current Annotation, Push to Miles, and Add to tempTimeline
          const milestone2 = {
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
            startTime: findAnnotTime(
              refAnnPointer.$.ANNOTATION_REF,
              "startTime"
            ),
            stopId: refAnnPointer.$.TIME_SLOT_REF2,
            stopTime: findAnnotTime(refAnnPointer.$.ANNOTATION_REF, "stopTime"),
            timeline: parsedPath.base
          };
          tempTimeline.addMilestone(milestone2);
        }
      }
    }
  }

  // Push TempTimeline to Timeline
  // FIXME: ASYNC Unsafe
  props.pushTimeline(tempTimeline);
  console.log("EAF Processed");
}
