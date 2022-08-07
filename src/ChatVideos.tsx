import { ILocalAudioTrack, ILocalVideoTrack, IAgoraRTCRemoteUser, IAgoraRTCClient, NetworkQuality } from "agora-rtc-sdk-ng"
import { ReactElement, useEffect, useState } from "react"
import { Badge } from "react-bootstrap"
import MediaPlayer from "./components/MediaPlayer"
import useAgroaRTCQuality from "./hooks/useAgoraRTCQuality"
import { IPublicUserInfo, useAzureAuth } from "./hooks/useAzureAuth"

export interface ChatVideosProps {
    userID?: number
    localAudioTrack?: ILocalAudioTrack
    localVideoTrack?: ILocalVideoTrack
    remoteUsers?: IAgoraRTCRemoteUser[]
    videoClient?: IAgoraRTCClient
    remoteUserInfo?: Map<number, IPublicUserInfo>
}

export function ChatVideos(props: ChatVideosProps) {

    const selfInfo = useAzureAuth().publicUserInfo;

    const remoteQualities = useAgroaRTCQuality(props.videoClient);

    const remotes = props.remoteUsers?.map((rtcUser) => {
        const rq = remoteQualities.get(rtcUser.uid);
        const e2eDelay = rq?.AudioStats?.end2EndDelay ?? rq?.VideoStats?.end2EndDelay;
        return {
            rtcUser,
            e2eDelay,
            userInfo: props.remoteUserInfo?.get(rtcUser.uid as number),
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
                    {selfInfo ? <img src={selfInfo.avatar_url} alt='' width="32" /> : undefined}
                    <span>
                        {selfInfo?.name ?? 'remoteTrack'}
                        ({props.userID})
                    </span>
                    {localBadge}
                </p>
                <MediaPlayer
                    videoTrack={props.localVideoTrack} audioTrack={props.localAudioTrack}
                    gainRange={[-40, 20]} disableAudio={true} />
            </div>
            {remotes?.map(remote => (
                <div className='remote-player-wrapper' key={remote.rtcUser.uid}>
                    <p className='remote-player-text'>
                        {remote.userInfo ? <img src={remote.userInfo.avatar_url} alt='' width="32" /> : undefined}
                        <span>
                            {remote.userInfo?.name ?? 'remoteTrack'}
                            ({remote.rtcUser.uid})
                        </span>
                        <Badge bg={latencyColor(remote.e2eDelay)}>
                            latency: {remote.e2eDelay}ms
                        </Badge>
                    </p>
                    <MediaPlayer videoTrack={remote.rtcUser.videoTrack} audioTrack={remote.rtcUser.audioTrack} />
                </div>
            ))}
        </div>
    )
}