export class Timelines {
    //vars
    //Typescript, add ? to st
    constructor(sources) {
        this.timeline = []
        this.timeline[0] = {}
        this.timeline[0]['instantiated'] = true
        this.timeline[0]['filename'] = []
        this.timeline[0]['filename'].push(sources[0])
        if (arguments.length > 1) {
            this.timeline[0]['filename'].push(sources[1])
        }
        this.timeline[0]['milestones'] = []
        this.nextId = 0
        var tlThis = this
        this.addNewTimeline = function (refFile) {
            this.timeline.push({instantiated: true, filename: refFile, milestones: []})
            return (this.timeline.length - 1)
        }
        this.addMilestone = function (index, newMilestone) {
            var m
            var dup = false
            for (m = 0; m < tlThis.timeline[index]['milestones'].length; m++) {
                if (tlThis.timeline[index]['milestones'][m]['startTime'] == newMilestone['startTime'] &&
                    tlThis.timeline[index]['milestones'][m]['stopTime'] == newMilestone['stopTime']) {
                    //alert("Dup!")
                    dup = true
                    //Todo Test Dups
                    if ('annotationID' in newMilestone) {
                        tlThis.timeline[index]['milestones'][m]['annotationID'] = newMilestone['annotationID']
                    }
                    newMilestone['data'].forEach(annot => {
                        tlThis.timeline[index]['milestones'][m]['data'].push(annot)
                    });
                }
            }
            if (!dup) {
                newMilestone['id'] = tlThis.getNextAnnotRef(0) //todo the 0 is temporary
                tlThis.timeline[index]['milestones'].push(newMilestone)
                tlThis.nextId += 1
            }
            //alert("pushed milestone")
        }
        this.getNextAnnotRef = function (index) {
            // need to handle multiple instances
            return tlThis.nextId
        }
        this.addFilenamesToIndex = function (index, filelist) {
            var f
            for (f = 0; f < filelist.length; f++) {
                if (tlThis.timeline[index]['filename'].indexOf(filelist[f]) == -1) {
                    tlThis.timeline[index]['filename'].push(filelist[f])
                }
            }
        }
        this.getIndexOfMedia = function (filelist) {
            var found = false
            var foundIndex = false
            var f
            for (f = 0; f < filelist.length; f++) {
                var m
                for (m = 0; m < tlThis.timeline.length; m++) {
                    if (tlThis.timeline[m]['filename'].indexOf(filelist[m]) > -1) {
                        found = true
                        foundIndex = m
                    }
                }
                if (!found) {
                    return -1
                }
                if (found) {
                    return foundIndex
                }
            }
        }

    }

}

export default Timelines;