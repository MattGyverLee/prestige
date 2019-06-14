import React, { Component } from "react";
import { connect } from 'react-redux'
import ReactPlayer from "react-player"
import { UpdatePlayerParam } from "../App";
import '../App.css';


//updatePlayerAction,



interface PlayProps {
    url: string,
    playing: boolean,
    volume: number,
    muted: boolean,
    playbackRate: number,
    parent?: any,
    loop: boolean,
    loaded?: number,
    played: number,
    pip?: boolean,
    duration?: number,
    controls?: boolean,
    player?: any,
    seeking?: boolean,
    state?: any

    playPause: () => void;
    stopPlaying: () => void;
    toggleLoop: () => void;
    onPlay: () => void;
    onEnded: () => void;
    onProgress: (state: any) => void;
    refreshApp?: (event: UpdatePlayerParam) => void
  }

class PlayerZone extends Component<PlayProps> {

    private player!:ReactPlayer
    //private audioPlayer!:WaveSurferInstance & WaveSurferRegions;


    pip = () => {
    this.setState({ pip: !this.props.pip })
    }
    setVolume = (e:any) => {
    this.setState({ volume: parseFloat(e.target.value) })
    }
    toggleMuted = () => {
    this.setState({ muted: !this.props.muted })
    }
    setPlaybackRate = (e: any) => {
    this.setState({ playbackRate: parseFloat(e.target.value) })
    }
    onPause = () => {
    console.log('onPause')
    this.setState({ playing: false })
    }
    onSeekMouseDown = (e: any) => {
    this.setState({ seeking: true })
    }
    onSeekChange = (e: any) => {
    this.setState({ played: parseFloat(e.target.value) })
    }
    onSeekMouseUp = (e: any) => {
    this.setState({ seeking: false })
    this.player.seekTo(parseFloat(e.target.value))
    }
    /* onProgress = (state: any) => {
    console.log('onProgress', state)
    // We only want to update time slider if we are not currently seeking
    if (!this.props.seeking) {
        this.setState(state)
    }
    } */
    onDuration = (duration: any) => {
    console.log('onDuration', duration)
    this.setState({ duration })
    }
    onClickFullscreen = () => {
    //screenfull.request(findDOMNode(this.player))
    } 

    ref = (player: any) => {
        this.player = player
      }
    
    render() {
    return (
       <div>
            <div className='player-wrapper'>
                    <ReactPlayer
                    ref={this.ref}
                    className='react-player'
                    width='100%'
                    height='100%'
                    url={this.props.url}
                    pip={this.props.pip}
                    playing={this.props.playing}
                    loop={this.props.loop}
                    playbackRate={this.props.playbackRate}
                    volume={this.props.volume}
                    muted={this.props.muted}
                    onReady={() => console.log('onReady')}
                    onStart={() => console.log('onStart')}
                    onPlay={this.props.onPlay}
                    onPause={this.onPause}
                    onBuffer={() => console.log('onBuffer')}
                    onSeek={e => console.log('onSeek', e)}
                    onEnded={this.props.onEnded}
                    onError={e => console.log('onError', e)}
                    onProgress={this.props.onProgress}
                    onDuration={this.onDuration}
                    />
            </div>
            <div className="audio-Layers">
            <div>
                <input type="radio" id="contactChoice1"
                    name="contact" value="email"/>
                <label htmlFor="contactChoice1">Translation</label>
                <input type="radio" id="contactChoice2"
                    name="contact" value="phone"/>
                <label htmlFor="contactChoice2">Original</label>
                <input type="radio" id="contactChoice3"
                    name="contact" value="mail"/>
                <label htmlFor="contactChoice3">Careful</label>
            </div>
            </div>
            <div className="mediaControls">
            <table>
                <tbody>
                    <tr>
                    <th>Controls</th>
                    <td>
                        <button onClick={this.props.stopPlaying}>Stop</button>
                        <button onClick={this.props.playPause}>{this.props.playing ? 'Pause' : 'Play'}</button>
                        <button onClick={this.onClickFullscreen}>Fullscreen</button>
                    </td>
                    </tr>
                    <tr>
                    <th>Speed</th>
                    <td>
                        <button onClick={this.setPlaybackRate} value={1}>1x</button>
                        <button onClick={this.setPlaybackRate} value={1.5}>1.5x</button>
                        <button onClick={this.setPlaybackRate} value={2}>2x</button>
                    </td>
                    </tr>
                    <tr>
                    <th>Seek</th>
                    <td>
                        <input
                        type='range' min={0} max={1} step='any'
                        value={this.props.played}
                        onMouseDown={this.onSeekMouseDown}
                        onChange={this.onSeekChange}
                        onMouseUp={this.onSeekMouseUp}
                        />
                    </td>
                    </tr>
                    <tr>
                    <th>Volume</th>
                    <td>
                        <input type='range' min={0} max={1} step='any' value={this.props.volume} onChange={this.setVolume} />
                    </td>
                    </tr>
                    <tr>
                    <th>
                        <label htmlFor='muted'>Muted</label>
                    </th>
                    <td>
                        <input id='muted' type='checkbox' checked={this.props.muted} onChange={this.toggleMuted} />
                    </td>
                    </tr>
                    <tr>
                    <th>
                        <label htmlFor='loop'>Loop</label>
                    </th>
                    <td>
                        <input id='loop' type='checkbox' checked={this.props.loop} onChange={this.props.toggleLoop} />
                    </td>
                    </tr>
                    <tr>
                    <th>Played</th>
                    <td><progress max={1} value={this.props.played} /></td>
                    </tr>
                    <tr>
                    <th>Loaded</th>
                    <td><progress max={1} value={this.props.loaded} /></td>
                    </tr>
                </tbody>
            </table>
            </div>
        </div>
        );
    }
}


export default connect()(PlayerZone)