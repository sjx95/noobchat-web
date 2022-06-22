import { ILocalAudioTrack, ILocalVideoTrack, IAgoraRTCRemoteUser, IAgoraRTCClient } from "agora-rtc-sdk-ng"
import MediaPlayer from "./components/MediaPlayer"

export interface ChatVideosProps {
    userID?: number
    localAudioTrack?: ILocalAudioTrack
    localVideoTrack?: ILocalVideoTrack
    remoteUsers?: IAgoraRTCRemoteUser[]
    videoClient?: IAgoraRTCClient
}

export function ChatVideos(props: ChatVideosProps) {

    return (
        <div>
            <div className='local-player-wrapper'>
                <p className='local-player-text'> localTrack({props.userID}) </p>
                <MediaPlayer
                    videoTrack={props.localVideoTrack} audioTrack={props.localAudioTrack}
                    gainRange={[-40, 20]} disableAudio={true} />
            </div>
            {props.remoteUsers?.map(user => (
                <div className='remote-player-wrapper' key={user.uid}>
                    <p className='remote-player-text'>{`remoteVideo(${user.uid})`}</p>
                    <MediaPlayer videoTrack={user.videoTrack} audioTrack={user.audioTrack} />
                </div>
            ))}
        </div>
    )
}