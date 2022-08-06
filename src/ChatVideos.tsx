import { ILocalAudioTrack, ILocalVideoTrack, IAgoraRTCRemoteUser, IAgoraRTCClient, NetworkQuality } from "agora-rtc-sdk-ng"
import { ReactElement, useEffect, useState } from "react"
import { Badge } from "react-bootstrap"
import MediaPlayer from "./components/MediaPlayer"
import useAgroaRTCQuality from "./hooks/useAgoraRTCQuality"
import { IPublicUserInfo } from "./hooks/useAzureAuth"

export interface ChatVideosProps {
    userID?: number
    localAudioTrack?: ILocalAudioTrack
    localVideoTrack?: ILocalVideoTrack
    remoteUsers?: IAgoraRTCRemoteUser[]
    videoClient?: IAgoraRTCClient
    remoteUserInfo?: Map<number, IPublicUserInfo>
}

export function ChatVideos(props: ChatVideosProps) {

    const remoteQualities = useAgroaRTCQuality(props.videoClient);

    const remotes = props.remoteUsers?.map((user) => {
        const rq = remoteQualities.get(user.uid);
        const e2eDelay = Math.max(rq?.AudioStats?.end2EndDelay ?? 0, rq?.AudioStats?.end2EndDelay ?? 0);
        const netDelay = Math.max(rq?.AudioStats?.transportDelay ?? 0, rq?.AudioStats?.transportDelay ?? 0);
        return {
            user, e2eDelay, netDelay,
            audioE2EDelay: rq?.AudioStats?.end2EndDelay
        };
    });

    const [localBadge, setLocalBadge] = useState<ReactElement>();
    useEffect(() => {
        if (!props.videoClient) {
            setLocalBadge(undefined);
            return
        };

        const listener = (stats: NetworkQuality) => {
            const quality = Math.max(stats.uplinkNetworkQuality, stats.downlinkNetworkQuality);
            let text: string = 'unknown';
            let color: string = 'secondary';

            if (quality === 0) {
                text = 'unknown';
                color = 'secondary';
            } else if (quality <= 2) {
                text = 'great';
                color = 'success';
            } else if (quality <= 4) {
                text = 'good';
                color = 'warning';
            } else {
                text = 'poor';
                color = 'danger';
            };
            setLocalBadge(<Badge bg={color}>network: {text}({quality})</Badge>)
        };
        props.videoClient.on('network-quality', listener);
        return () => { props.videoClient?.off('network-quality', listener) }
    }, [props.videoClient, setLocalBadge]);

    const latencyColor = (latency: number | undefined): string => {
        if (latency === undefined) return 'secondary';
        if (latency > 300) return 'danger';
        if (latency > 150) return 'warning';
        return 'success';
    };

    return (
        <div>
            <div className='local-player-wrapper'>
                <p className='local-player-text'>
                    <span>localTrack({props.userID})</span>
                    {localBadge}
                </p>
                <MediaPlayer
                    videoTrack={props.localVideoTrack} audioTrack={props.localAudioTrack}
                    gainRange={[-40, 20]} disableAudio={true} />
            </div>
            {remotes?.map(remote => (
                <div className='remote-player-wrapper' key={remote.user.uid}>
                    <p className='remote-player-text'>
                        <span>
                            {props.remoteUserInfo?.get(remote.user.uid as number)?.name ?? 'remoteTrack'}
                            ({remote.user.uid})
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