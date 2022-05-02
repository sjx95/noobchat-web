import React, { useEffect, useState } from 'react';
import AgoraRTC, { ILocalTrack } from 'agora-rtc-sdk-ng';
import useAgora from './hooks/useAgora';
import MediaPlayer from './components/MediaPlayer';
import './Call.css';
import 'agora-access-token';
import { RtcRole, RtcTokenBuilder, RtmTokenBuilder, RtmRole } from 'agora-access-token';
import useAgoraRTM from './hooks/useAgoraRTM';

const client = AgoraRTC.createClient({ codec: 'h264', mode: 'rtc' });
const appID = process.env.REACT_APP_AGORA_APP_ID ?? ""
const appCertificate = process.env.REACT_APP_AGORA_APP_CERTIFICATE ?? ""
const userID = Math.floor(Math.random() * (1 << 31 - 1));

function genRTCToken(channelName: string): string {
  const uid = 0;
  const role = RtcRole.PUBLISHER;
  const privilegeExpiredTs = 0
  return RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channelName, uid, role, privilegeExpiredTs)
}

function genRTMToken(): string {
  const token = RtmTokenBuilder.buildToken(appID, appCertificate, userID.toString(), RtmRole.Rtm_User, 86400);
  return token;
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
  const [message, setMessage] = useState('');
  const { localAudioTrack, localVideoTrack, leave, join, joinState, remoteUsers } = useAgora(client);
  const rtm = useAgoraRTM();

  return (
    <div className='call'>
      <form className='call-form'>
        <label>
          Channel:
          <input value={channel} type='text' name='channel' onChange={(event) => { setChannel(event.target.value) }} />
        </label>
        <label>
          Audio:
          <input type='checkbox' {...useTrackControl(joinState, localAudioTrack)} />
        </label>
        <label>
          Video:
          <input type='checkbox' {...useTrackControl(joinState, localVideoTrack)} />
        </label>
        <div className='button-group'>
          <label>RTC Online: <input type='checkbox' disabled={true} checked={joinState} /></label>
          <label>RTM Online: <input type='checkbox' disabled={true} checked={rtm.joinState} /></label>
          <button id='join' type='button' className='btn btn-primary btn-sm' disabled={joinState || rtm.joinState}
            onClick={async () => {
              await join(appID, channel, genRTCToken(channel), userID);
              await rtm.join(appID, channel, userID.toString(), genRTMToken());
            }}>Join</button>
          <button id='leave' type='button' className='btn btn-primary btn-sm' disabled={!joinState && !rtm.joinState}
            onClick={async () => {
              await rtm.leave();
              await leave();
            }}>Leave</button>
        </div>
      </form>
      <div className='rtc-container'>
        <div className='local-player-wrapper'>
          <p className='local-player-text'>{localVideoTrack && `localTrack`}{joinState && localVideoTrack ? `(${client.uid})` : ''}</p>
          <MediaPlayer videoTrack={localVideoTrack} audioTrack={localAudioTrack} disableAudio={true} />
        </div>
        {remoteUsers.map(user => (
          <div className='remote-player-wrapper' key={user.uid}>
            <p className='remote-player-text'>{`remoteVideo(${user.uid})`}</p>
            <MediaPlayer videoTrack={user.videoTrack} audioTrack={user.audioTrack} />
          </div>
        ))}
      </div>
      <div className='rtm-container'>
        {rtm.history.map(str => <div>{str}</div>)}
        <div>
          {userID}:
          <input type='text' value={message} onChange={(event) => setMessage(event.target.value)} />
          <button disabled={!rtm.joinState}
            onClick={() => { rtm.sendMessage(message); setMessage(''); }}> Send </button>
        </div>
      </div>
    </div>
  );
}

export default Call;
