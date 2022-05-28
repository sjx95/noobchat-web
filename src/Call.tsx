import React, { useEffect, useState } from 'react';
import { IAgoraRTCClient, IAgoraRTCRemoteUser, ILocalAudioTrack, ILocalTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
import MediaPlayer from './components/MediaPlayer';
import 'agora-access-token';
import { Col, Container, Row } from 'react-bootstrap';
import { useWrappedState } from './hooks/useWrappedStates';
import { RtmChannel, RtmClient } from 'agora-rtm-sdk';
import { ChatController } from './ChatController';


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

export default function Call() {

  const gs = {
    channel: useWrappedState('test-web-room'),
    videoInputDevice: useWrappedState(''),
    audioInputDevice: useWrappedState('default'),
    audioOutputDevice: useWrappedState('default'),
    subscribeVideo: useWrappedState(true),
    subscribeAudio: useWrappedState(true),
    rtcRemoteUsers: useWrappedState<IAgoraRTCRemoteUser[]>([]),

    joined: useWrappedState(false),

    videoClient: useWrappedState<IAgoraRTCClient | undefined>(undefined),
    msgClient: useWrappedState<RtmClient | undefined>(undefined),
    msgChannel: useWrappedState<RtmChannel | undefined>(undefined),

  };

  return (
    <Container fluid={true}>
      <Row>
        <Col lg={3}>
          <ChatController {...gs} />
        </Col>
        <Col lg={6}>
          <ChatVideos userID={0} />
        </Col>
        <Col lg={3}>
          <ChatTexts sendMessage={() => { }} />
        </Col>
      </Row>

    </Container>
  );
}



export interface ChatVideosProps {
  userID?: number
  localAudioTrack?: ILocalAudioTrack
  localVideoTrack?: ILocalVideoTrack
  remoteUsers?: IAgoraRTCRemoteUser[]
}

function ChatVideos(props: ChatVideosProps) {
  return (
    <div>
      <div className='local-player-wrapper'>
        <p className='local-player-text'> localTrack({props.userID}) </p>
        <MediaPlayer videoTrack={props.localVideoTrack} audioTrack={props.localAudioTrack} disableAudio={true} />
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

export interface ChatTextsProps {
  userID?: number
  history?: string[],
  sendMessage: Function
}

function ChatTexts(props: ChatTextsProps) {
  const [message, setMessage] = useState('');
  return (
    <div>
      {props.history?.map(str => <div>{str}</div>)}
      <div>
        {props.userID}:
        <input type='text' value={message} onChange={(event) => setMessage(event.target.value)} />
        <button onClick={() => { props.sendMessage(message); setMessage(''); }}>
          Send
        </button>
      </div>
    </div>
  )
}