import { ILocalAudioTrack, ILocalVideoTrack, IAgoraRTCRemoteUser, IAgoraRTCClient, UID } from "agora-rtc-sdk-ng"
import { useState } from "react"
import { Badge } from "react-bootstrap"
import MediaPlayer from "./components/MediaPlayer"
import useAgroaRTCQuality from "./hooks/useAgoraRTCQuality"

export interface ChatVideosProps {
    userID?: number
    localAudioTrack?: ILocalAudioTrack
    localVideoTrack?: ILocalVideoTrack
    remoteUsers?: IAgoraRTCRemoteUser[]
    videoClient?: IAgoraRTCClient
}

export function ChatVideos(props: ChatVideosProps) {

    const remoteQualities = useAgroaRTCQuality(props.videoClient);

    const remotes = props.remoteUsers?.map((user) => {
        const rq = remoteQualities.get(user.uid);
        const netQuality = Math.min(rq?.NetworkQuality?.uplinkNetworkQuality ?? 0, rq?.NetworkQuality?.downlinkNetworkQuality ?? 0);
        const e2eDelay = Math.max(rq?.AudioStats?.end2EndDelay ?? 0, rq?.AudioStats?.end2EndDelay ?? 0);
        const netDelay = Math.max(rq?.AudioStats?.transportDelay ?? 0, rq?.AudioStats?.transportDelay ?? 0);
        return {
            user, netQuality, e2eDelay, netDelay,
            audioE2EDelay: rq?.AudioStats?.end2EndDelay
        };
    });

    const latencyColor = (latency: number | undefined): string => {
        if (latency === undefined) return 'secondary';
        if (latency > 300) return 'danger';
        if (latency > 150) return 'warning';
        return 'success';
    };



    return (
        <div>
            <div className='local-player-wrapper'>
                <p className='local-player-text'> localTrack({props.userID}) </p>
                <MediaPlayer
                    videoTrack={props.localVideoTrack} audioTrack={props.localAudioTrack}
                    gainRange={[-40, 20]} disableAudio={true} />
            </div>
            {remotes?.map(remote => (
                <div className='remote-player-wrapper' key={remote.user.uid}>
                    <p className='remote-player-text'>
                        <span>
                            {`remoteVideo(${remote.user.uid})`}
                        </span>
                        <Badge bg={latencyColor(remote.audioE2EDelay)}>
                            latency: {remote.audioE2EDelay}ms
                        </Badge>
                    </p>
                    <MediaPlayer videoTrack={remote.user.videoTrack} audioTrack={remote.user.audioTrack} />
                </div>
            ))}
        </div>
    )
}