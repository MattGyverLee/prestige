// Describing the shape of the tree's slice of state
export interface MediaPlayerState {
    url: string,
    pip: boolean,
    playing: boolean,
    volume: number,
    muted: boolean,
    controls: boolean,
    played: boolean,
    loaded: boolean,
    duration: number,
    playbackRate: number,
    loop: boolean,
    deleteme: boolean
  }