export interface InputFile {
    id: number; //ID number
    out: string; //Output Pad
    path: string; // a relative path
    start: number; // in seconds from beginning (decimal)
    end: number; // in seconds from beginning (decimal)
    speed: number; // from 0-2 in "x"
    gain?: number; // only for audio
    segment: number; // 
  }

const vidTracks = [
    { id: 0, out: 'v0', path: 'clip1.mp4', start: 90, end: 120, speed: 0.667, segment: 1 },
    { id: 2, out: 'v2', path: 'clip2.mp4', start: 120, end: 135, speed: 0.667, segment: 2 }
  ];
  
  // Define the wave files for each input file
const audTrack = [
    { id: 1, out: 'a1', path: 'waveFile1.wav', start: 90, end: 120, speed: 0.667, gain: 0, segment: 1 },
    { id: 3, out: 'a3', path: 'waveFile2.wav', start: 120, end: 135, speed: 0.667, gain: 0, segment: 2 }
  ];  

export function LookForOutsizedChunks(
    vidTracks: InputFile[],
    audTracks: InputFile[]
  ): string {
    var result = ""
    vidTracks.forEach((vidTrack, index) => {
        const vidLength = (vidTrack.end-vidTrack.start)*vidTrack.speed
        const audLength = (audTracks[index].end-audTracks[index].start)*audTracks[index].speed
        const diff = vidLength - audLength
        result += "Segment" + vidTrack.segment+ ": " + diff + " seconds difference\n"
    });
    return result;
  }

    const filterBySegment = (audTrack: InputFile[], segment: number) => {
    return audTrack.filter((track) => {
      return track.segment === segment;
    });
};

export function generateUnifiedFFMpegCommand(
    vidTracks: InputFile[],
    audTracks: InputFile[]
  ): string {

    const inputs: string[] = [];
    const videoFilters: string[] = [];
    const audioFilters: string[] = [];
    var vidOuts: string = "";
    var audOuts: string = "";

    vidTracks.forEach((vidTrack, index) => {
        inputs.push(`-i ${vidTrack.path}`);
        inputs.push(`-i ${audTracks[index].path}`);
    });
    // Generate Video Filters
    var segments: number[] = []
    vidTracks.forEach((vidTrack, index) => {
      // Create video filter for input file
      const videoFilter = `[${vidTrack.id}:v]trim=start=${vidTrack.start}:end=${vidTrack.end},setpts=${vidTrack.speed}*PTS[${vidTrack.out}]`;
      vidOuts += `[${vidTrack.out}]`;
      videoFilters.push(videoFilter);
      segments.push(vidTrack.segment);
    });
    // Concatenate the video streams
    const videoConcatFilter = `${videoFilters.join(';')}${vidOuts}concat=n=${vidTracks.length}:v=1:a=0[v]`;
    
    segments.forEach((segment) => {
        const segmentAudio: InputFile[] = filterBySegment(audTracks, segment);
        if (segmentAudio.length == 1) {
            const audTrack = segmentAudio[0];
            const audioFilter = `[${audTrack.id}:a]atrim=start=${audTrack.start}:end=${audTrack.end},asetpts=PTS-STARTPTS[${audTrack.out}]`;
            audOuts += `[${audTrack.out}]`;
            audioFilters.push(audioFilter);
        }
        else if (segmentAudio.length > 1) {
            // TODO:
            var midPads: string[] = []  
            segmentAudio.forEach((audTrack, index) => {
                // Create audio filter for input file
                const audioFilter = `[${audTrack.id}:a]atrim=start=${audTrack.start}:end=${audTrack.end},asetpts=PTS-STARTPTS[${audTrack.out}]`;
                audioFilters.push(audioFilter);
                midPads.push(`[${audTrack.out}]`)
                // [3:a][4:a][0:a]amix=inputs=3[a]; 
            });
            const audioMerge = `${midPads.join()}amix=inputs=${midPads.length}[aS${segment}]`
            audioFilters.push(audioMerge);
            audOuts += `[aS${segment}]`;
        }
        else {
            // Deal with missing audio?
        }
    });
    

    // Concatenate the audio streams
    const audioConcatFilter = `${audioFilters.join(';')}${audOuts}concat=n=${audTracks.length}:v=0:a=1[a]`;
  
    // Combine the video and audio filters
    const filterComplex = `-filter_complex "${videoConcatFilter};${audioConcatFilter}"`;
  
    // Set the output mapping
    const outputMap = '-map "[v]" -map "[a]"';
  
    // Set the output file
    const outputFile = 'output.mp4';
  
    // Combine all the options and return the FFmpeg command
    const options = `${inputs.join(' ')} ${filterComplex} ${outputMap} ${outputFile}`;
    return `ffmpeg ${options}`;
  }