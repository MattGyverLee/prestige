import * as actions from "../store";

import React, { Component } from "react";
import { faLayerGroup, faVolumeUp } from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import WaveSurfer from "wavesurfer.js";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { sourceAudio } from "./globalFunctions";

interface StateProps {
  timeline: any;
  sourceMedia: any;
  annotMedia: any;
  volumes: number[];
  waveSurfers: any;
  pos: number;
  playing: boolean;
}

interface DispatchProps {
  toggleWaveSurferPlay: typeof actions.toggleWaveSurferPlay;
  waveSurferPosChange: typeof actions.waveSurferPosChange;
  setWaveSurfer: typeof actions.setWaveSurfer;
  setWSVolume: typeof actions.setWSVolume;
}

interface DeeJayProps extends StateProps, DispatchProps {}

export class DeeJay extends Component<DeeJayProps> {
  componentDidMount = () => {
    [0, 1, 2].forEach((idx: number) => {
      this.props.setWaveSurfer(
        WaveSurfer.create({
          container: "#waveform" + idx.toString(),
          height: 50,
          barWidth: 1,
          cursorWidth: 1,
          backend: "MediaElement",
          progressColor: "#4a74a5",
          cursorColor: "#4a74a5",
          responsive: true,
          waveColor: "#ccc",
          hideScrollbar: true
        }),
        idx
      );
    });
  };

  testLoad = () => {
    if (this.props.waveSurfers[0] !== null) {
      this.props.waveSurfers[0].load(
        sourceAudio(this.props.sourceMedia)[0].blobURL + "#t=65,70"
      );
      this.props.waveSurfers[0].on("waveform-ready", () =>
        this.onSurferReady(0)
      );
      this.props.setWSVolume(0, this.props.volumes[0]);
      this.props.waveSurfers[0].on("pause", () => {
        this.props.waveSurfers[0].seekTo(0.5);
      });
    }
    this.loadCarefulAnnot();
  };

  loadCarefulAnnot = () => {
    const isDev = require("electron-is-dev");
    let ffmpegPath = "";
    let ffprobePath = "";
    if (isDev) {
      ffmpegPath =
        process.cwd() +
        "\\node_modules\\ffmpeg-static-electron\\bin\\win\\x64\\ffmpeg.exe";
      ffprobePath =
        process.cwd() +
        "\\node_modules\\ffprobe-static-electron\\bin\\win\\x64\\ffprobe.exe";
    } else {
      ffmpegPath = require("ffmpeg-static-electron").path;
      ffprobePath = require("ffprobe-static-electron").path;
    }
    let fluentFfmpeg = require("fluent-ffmpeg");
    fluentFfmpeg.setFfmpegPath(ffmpegPath);
    fluentFfmpeg.setFfprobePath(ffprobePath);
    let fs = require("fs-extra");
    let filteredAnnot: any[] = this.props.annotMedia.filter((am: any) =>
      am.name.includes("_Careful")
    );
    let i = filteredAnnot.length;
    let j, k;
    let path = require("path");
    let previous = -1;
    let inputFiles: any[] = [];
    let inputTimes: any[] = [];
    let dir = "";
    let lastTime = 0;
    const currentDuration = (metadata: any): number => {
      return metadata.streams[0].duration;
    };
    for (k = 0; k < i; k++) {
      let idx = 0;
      let lowest = -1;

      for (j = 0; j < i; j++) {
        let curr = filteredAnnot[j];

        if (
          (lowest === -1 ||
            lowest >
              parseFloat(curr.name.substring(0, curr.name.indexOf("_")))) &&
          parseFloat(curr.name.substring(0, curr.name.indexOf("_"))) >= previous
        ) {
          lowest = parseFloat(curr.name.substring(0, curr.name.indexOf("_")));
          idx = j;
        }
      }
      let curr = filteredAnnot[idx];
      dir = curr.path.substring(0, curr.path.lastIndexOf(path.sep) + 1);
      previous = parseFloat(curr.name.split("_")[2]);
      inputFiles.push(curr.path);
    }
    let mergedAudio = fluentFfmpeg();
    inputFiles.forEach((v: string) => (mergedAudio = mergedAudio.addInput(v)));
    mergedAudio._inputs.forEach((v: any, idx: number) => {
      mergedAudio.ffprobe(idx, function(err: any, metadata: any) {
        const name = v.source.substring(
          v.source.lastIndexOf(path.sep) + 1,
          v.source.length
        );

        inputTimes.push({
          file: v.source,
          name,
          duration: currentDuration(metadata).toFixed(3),
          refStart: parseFloat(name.split("_")[0]).toFixed(3),
          refStop: parseFloat(name.split("_")[2]).toFixed(3),
          start: lastTime,
          stop: lastTime + currentDuration(metadata)
        });
        lastTime = lastTime + currentDuration(metadata);
        if (err) {
          console.error("Oops");
        }
      });
    });
    fs.writeFile(
      dir + "Careful_Merged.json",
      JSON.stringify(inputTimes, null, 2),
      function(err: any) {
        if (err) {
          console.error("Oops");
        }
      }
    );
    mergedAudio
      .format("mp3")
      .audioBitrate("128k")
      .audioChannels(2)
      .audioCodec("libmp3lame")
      .mergeToFile(dir + "Careful_Merged.mp3", dir)
      .outputOptions("-y")
      .on("start", function(command: any) {
        console.log("ffmpeg process started:", command);
      })
      .on("error", function(err: any) {
        console.log("An error occurred: " + err.message);
      })
      .on("end", function() {
        console.log("Merging finished!");
      });
  };

  handleTogglePlay() {
    this.props.toggleWaveSurferPlay();
  }

  handlePosChange = (e: any) => {
    this.props.waveSurferPosChange(e.originalArgs[0]);
  };

  onSurferReady = (idx: number) => {
    this.props.waveSurfers[idx].play();
  };

  setVolume = (e: any) => {
    this.props.setWSVolume(parseInt(e.target.id), e.target.value);
  };

  render() {
    const waveTableRows = [0, 1, 2].map((idx: number) => {
      return (
        <tr key={idx.toString()}>
          <td className="wave-table-play">
            <FontAwesomeIcon icon={faVolumeUp} />
          </td>
          <td className="wave-table-overlay">
            <FontAwesomeIcon icon={faLayerGroup} />
          </td>
          <td className="wave-table-volume">
            <input
              id={idx.toString()}
              type="range"
              min={0}
              max={1}
              step={0.2}
              onChange={this.setVolume}
              value={this.props.volumes[idx]}
            />
          </td>
          <td className="waveform" id={"waveform" + idx.toString()}></td>
        </tr>
      );
    });

    return (
      <div>
        <button onClick={this.testLoad}></button>
        <div className="wave-table-container">
          <table className="wave-table">
            <tbody>{waveTableRows}</tbody>
          </table>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: actions.StateProps): StateProps => ({
  pos: state.deeJay.pos,
  playing: state.deeJay.playing,
  timeline: state.annotations.timeline,
  waveSurfers: state.deeJay.waveSurfers,
  volumes: state.deeJay.volumes,
  sourceMedia: state.tree.sourceMedia,
  annotMedia: state.tree.annotMedia
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators(
    {
      waveSurferPosChange: actions.waveSurferPosChange,
      toggleWaveSurferPlay: actions.toggleWaveSurferPlay,
      setWaveSurfer: actions.setWaveSurfer,
      setWSVolume: actions.setWSVolume
    },
    dispatch
  )
});
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DeeJay);

/*        
<div className="mediaControls">
          <table>
            <tbody>
              <tr>
                <th>Volume</th>
                <td>
                  <input
                    max={1}
                    min={0}
                    onChange={this.onVolumeChange}
                    step="any"
                    type="range"
                    value={this.props.volume}
                  />
                </td>
              </tr>
              <tr>
                <th>
                  <label htmlFor="muted">Muted</label>
                </th>
                <td>
                  <input
                    checked={this.props.muted}
                    id="muted"
                    onChange={this.props.toggleMuted}
                    type="checkbox"
                  />
                </td>
              </tr>
              <tr>
                <th>Played</th>
                <td>
                  <progress max={1} value={this.props.played} />
                </td>
              </tr>
              <tr>
                <th>remaining</th>
                <td>
                  <Duration
                    className="Duration-Remaining"
                    seconds={(
                      this.props.duration *
                      (1 - this.props.played)
                    ).toFixed(3)}
                  />
                </td>
              </tr>
              <tr>
                <th>Loaded</th>
                <td>
                  <progress max={1} value={this.props.loaded} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
*/
