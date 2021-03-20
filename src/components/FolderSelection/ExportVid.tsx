import { LooseObject } from "../../store/annot/types";

/* eslint-disable @typescript-eslint/no-unused-vars */
export function ExportVideo(
  timeline: LooseObject,
  multiplier: number,
  WSVolumes: [number]
): boolean {
  // Do things

  /* Pre-Process video adding timestamp if desired.
  Export to Standard Width. Place right aligned a certain distance from top right edge.
  
  https://superuser.com/questions/1013753/how-can-i-overlay-the-captured-timestamp-onto-a-video-using-ffmpeg-in-yyyy-mm-dd
  Example:
  ffmpeg -i in.webm -filter_complex "drawtext=fontfile=/usr/share/fonts/truetype/arial.ttf: text='%{pts \:flt}': x=100 : y=50 : box=1" -c:a copy out.webm
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
  Read State to get WS Volumes.
  First WS Vol>50, is KING, Next is PRINCE1, next is PRINCE2
  First WS Vol<50 is VO1, second is VO2.
  Video is VID
  i.e. KING=0, PRINCE1=1, VO1=2, PRINCE2=-1, VO2=-1

  For Each Milestone:

    King Round
    ---
    A1: WS[King], Start-Time, Stop-Time, Mult, Vol.
        KingLen = (KingStop-KingStart)*Mult
    V1: VID, Start-Time, Stop-Time, VidMult, Vol
        VidMult = KingLen/(VidStart-VidStop)
    A2: VO1, Start-Time, Stop-time, VO1Mult, Vol. 
        VOMult = KingLen/(VidStart-VidStop)
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
