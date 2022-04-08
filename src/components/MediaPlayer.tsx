import { ILocalVideoTrack, IRemoteVideoTrack, ILocalAudioTrack, IRemoteAudioTrack } from "agora-rtc-sdk-ng";
import React, { useRef, useEffect, useState } from "react";

export interface VideoPlayerProps {
  videoTrack: ILocalVideoTrack | IRemoteVideoTrack | undefined;
  audioTrack: ILocalAudioTrack | IRemoteAudioTrack | undefined;
  disableVideo?: boolean;
  disableAudio?: boolean;
}

const MediaPlayer = (props: VideoPlayerProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (props.disableVideo) return;
    if (!container.current) return;
    props.videoTrack?.play(container.current);
    return () => {
      props.videoTrack?.stop();
    };
  }, [container, props.videoTrack, props.disableVideo]);

  useEffect(() => {
    if (props.disableAudio) return;
    if (props.audioTrack) {
      props.audioTrack?.play();
    }
    return () => {
      props.audioTrack?.stop();
    };
  }, [props.audioTrack, props.disableAudio]);

  const [level, setLevel] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLevel(props.audioTrack?.getVolumeLevel() ?? 0), 50);
    return () => clearInterval(id);
  }, [props.audioTrack]);

  const [volume, setVolume] = useState(100);
  useEffect(() => props.audioTrack?.setVolume(volume), [volume, props.audioTrack]);

  return (
    <div>
      <div ref={container} className="video-player" style={{ width: "320px", height: "240px" }} />
      <div>
        Track Level: <progress value={level} max={1}> {level} </progress>
      </div>
      <div>
        Track Volume:
        <input type='range' min={0} max={200} step={10} value={volume}
          onChange={(event) => setVolume(event.target.valueAsNumber)} />
        {volume} %
      </div>
    </div>
  );
}

export default MediaPlayer;