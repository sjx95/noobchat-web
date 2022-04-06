import React, { useEffect, useState } from 'react';
import AgoraRTC, { ILocalTrack } from 'agora-rtc-sdk-ng';
import useAgora from './hooks/useAgora';
import MediaPlayer from './components/MediaPlayer';
import './Call.css';
import 'agora-access-token';
import { RtcRole, RtcTokenBuilder } from 'agora-access-token';

const client = AgoraRTC.createClient({ codec: 'h264', mode: 'rtc' });
const appID = process.env.REACT_APP_AGORA_APP_ID ?? ""
const appCertificate = process.env.REACT_APP_AGORA_APP_CERTIFICATE ?? ""

function GenToken(channelName: string): string {
  const uid = 0;
  const role = RtcRole.PUBLISHER;
  const privilegeExpiredTs = 0
  return RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channelName, uid, role, privilegeExpiredTs)
}

function useTrackControl(joinState: boolean, track: ILocalTrack | undefined) {
  const [checked, setChecked] = useState(true);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    if (!joinState || !track) { setChecked(true); setDisabled(true) };
    if (joinState && track) { setDisabled(false) };
  }, [joinState, track]);

  const onChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setChecked(event.target.checked);

    if (track) {
      setDisabled(true);
      track?.setEnabled(event.target.checked).then(() => setDisabled(false));
    }
  }

  return { checked, disabled, onChange }
}

function Call() {
  const [channel, setChannel] = useState('test-web-room');
  const {
    // eslint-disable-next-line
    localAudioTrack, localVideoTrack, leave, join, joinState, remoteUsers
  } = useAgora(client);

  return (
    <div className='call'>
      <form className='call-form'>
        <label>
          Channel:
          <input defaultValue={channel} type='text' name='channel' onChange={(event) => { setChannel(event.target.value) }} />
        </label>
        <label>Audio:</label>
        <input type='checkbox' {...useTrackControl(joinState, localAudioTrack)} />
        <label>Video:</label>
        <input type='checkbox' {...useTrackControl(joinState, localVideoTrack)} />
        <div className='button-group'>
          <button id='join' type='button' className='btn btn-primary btn-sm' disabled={joinState} onClick={() => { join(appID, channel, GenToken(channel)) }}>Join</button>
          <button id='leave' type='button' className='btn btn-primary btn-sm' disabled={!joinState} onClick={() => { leave() }}>Leave</button>
        </div>
      </form>
      <div className='player-container'>
        <div className='local-player-wrapper'>
          <p className='local-player-text'>{localVideoTrack && `localTrack`}{joinState && localVideoTrack ? `(${client.uid})` : ''}</p>
          <MediaPlayer videoTrack={localVideoTrack} audioTrack={undefined}></MediaPlayer>
        </div>
        {remoteUsers.map(user => (
          <div className='remote-player-wrapper' key={user.uid}>
            <p className='remote-player-text'>{`remoteVideo(${user.uid})`}</p>
            <MediaPlayer videoTrack={user.videoTrack} audioTrack={user.audioTrack}></MediaPlayer>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Call;
