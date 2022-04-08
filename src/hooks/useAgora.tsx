import { useState, useEffect } from 'react';
import AgoraRTC, {
  IAgoraRTCClient, IAgoraRTCRemoteUser, MicrophoneAudioTrackInitConfig, CameraVideoTrackInitConfig, IMicrophoneAudioTrack, ICameraVideoTrack, ILocalVideoTrack, ILocalAudioTrack, ILocalTrack
} from 'agora-rtc-sdk-ng';

export default function useAgora(client: IAgoraRTCClient | undefined)
  : {
    localAudioTrack: ILocalAudioTrack | undefined,
    localVideoTrack: ILocalVideoTrack | undefined,
    joinState: boolean,
    leave: Function,
    join: Function,
    remoteUsers: IAgoraRTCRemoteUser[],
  } {
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | undefined>(undefined);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | undefined>(undefined);

  const [joinState, setJoinState] = useState(false);

  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);

  async function createLocalTracks(audioConfig?: MicrophoneAudioTrackInitConfig, videoConfig?: CameraVideoTrackInitConfig)
    : Promise<[IMicrophoneAudioTrack | undefined, ICameraVideoTrack | undefined]> {

    let ret: [IMicrophoneAudioTrack | undefined, ICameraVideoTrack | undefined] = [undefined, undefined];

    try {
      const microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack(audioConfig);
      setLocalAudioTrack(microphoneTrack);
      ret[0] = microphoneTrack;
    } catch (error) {
      alert(error);
    }
    try {
      const cameraTrack = await AgoraRTC.createCameraVideoTrack(videoConfig);
      setLocalVideoTrack(cameraTrack);
      ret[1] = cameraTrack;
    } catch (error) {
      alert(error);
    }

    return ret;
  }

  async function join(appid: string, channel: string, token?: string, uid?: string | number | null) {
    if (!client) return;

    const [microphoneTrack, cameraTrack] = await createLocalTracks(
      { AGC: false, AEC: true, ANS: true }, undefined);

    await client.join(appid, channel, token || null);
    await client.publish([microphoneTrack, cameraTrack].filter((curr) => curr) as ILocalTrack[]);

    (window as any).client = client;
    (window as any).videoTrack = cameraTrack;

    setJoinState(true);
  }

  async function leave() {
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
    }
    setRemoteUsers([]);
    setJoinState(false);
    await client?.leave();
  }

  useEffect(() => {
    if (!client) return;
    setRemoteUsers(client.remoteUsers);

    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      await client.subscribe(user, mediaType);
      // toggle rerender while state of remoteUsers changed.
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    }
    const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    }
    const handleUserJoined = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    }
    const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(remoteUsers => Array.from(client.remoteUsers));
    }
    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);
    client.on('user-joined', handleUserJoined);
    client.on('user-left', handleUserLeft);

    return () => {
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
      client.off('user-joined', handleUserJoined);
      client.off('user-left', handleUserLeft);
    };
  }, [client]);

  return {
    localAudioTrack,
    localVideoTrack,
    joinState,
    leave,
    join,
    remoteUsers,
  };
}