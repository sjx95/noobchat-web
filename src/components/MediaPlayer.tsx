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

  const [volume, setVolume] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setVolume(props.audioTrack?.getVolumeLevel() ?? 0), 50);
    return () => clearInterval(id);
  }, [props.audioTrack]);

  props.audioTrack?.getMediaStreamTrack()

  return (
    <div>
      <div ref={container} className="video-player" style={{ width: "320px", height: "240px" }} />
      <div>
        Track volume: <progress value={volume} max={1}> {volume} </progress>
      </div>
    </div>
  );
}

export default MediaPlayer;