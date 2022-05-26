import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import AgoraRTC, { IAgoraRTCRemoteUser, ILocalAudioTrack, ILocalTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
import useAgora from './hooks/useAgora';
import MediaPlayer from './components/MediaPlayer';
import './Call.css';
import 'agora-access-token';
import { RtcRole, RtcTokenBuilder, RtmTokenBuilder, RtmRole } from 'agora-access-token';
import useAgoraRTM from './hooks/useAgoraRTM';
import { Button, Col, Container, Dropdown, FloatingLabel, Form, Row } from 'react-bootstrap';
import ThemeProvider, { useBootstrapBreakpoints } from 'react-bootstrap/esm/ThemeProvider';

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

interface ICallStates {
  channel: { value: string, onChange: ((value: string) => void) }
}

export default function Call() {

  const [channel, setChannel] = useState('test-web-room');
  const [message, setMessage] = useState('');
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | undefined>();
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack>();
  const [rtcRemoteUsers, setRTCRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const { leave, join, joinState, remoteUsers } = useAgora(client);
  const rtm = useAgoraRTM();

  const state: ICallStates = {
    channel: { value: channel, onChange: setChannel }
  };

  return (
    <Container fluid={true}>
      <Row>
        <Col lg={3}>
          <ChatController setLocalAudioTrack={setLocalAudioTrack} setLocalVideoTrack={setLocalVideoTrack} setRTCRemoteUsers={setRTCRemoteUsers} />
        </Col>
        <Col lg={6}>
          <Videos userID={userID} />
        </Col>
        <Col lg={3}>
          <Chats sendMessage={() => { }} />
        </Col>
      </Row>

    </Container>
  );
}

interface ChatControllerProps {
  setLocalAudioTrack: (track: ILocalAudioTrack) => void,
  setLocalVideoTrack: (track: ILocalVideoTrack) => void,
  setRTCRemoteUsers: Dispatch<SetStateAction<IAgoraRTCRemoteUser[]>>,
};

function ChatController(props: ChatControllerProps) {

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => { updateDevices(); }, [])

  async function updateDevices() {
    const ds = await AgoraRTC.getDevices();
    console.log('AgoraRTC.getDevices():', ds);
    setDevices(ds);
  }

  const [channel, setChannel] = useState('test-web-room');
  const { localAudioTrack, localVideoTrack, leave, join, joinState, remoteUsers } = useAgora(client);
  const rtm = useAgoraRTM();

  return (
    <Form>
      <Row>
        <Col> Room Control</Col>
      </Row>
      <Row>
        <Col>
          <FloatingLabel label='Channel' controlId='channel' className='mb-3'>
            <Form.Control />
          </FloatingLabel>
        </Col>
      </Row>
      <Row>
        <Col> Local Device Control</Col>
      </Row>
      <Row xs={4} lg={1}>
        <Col>
          <div className="d-grid">
            <Button as='div' variant="primary" size="lg">
              Refresh Devices
            </Button>
          </div>
        </Col>
        <FloatingLabel as={Col} label='Audio Input'>
          <Form.Select>
            <option value=""> Disable </option>
            {devices.filter((d) => { return d.kind === 'videoinput' }).
              map((d) => { return (<option value={d.deviceId}> {d.label} </option>) })}
          </Form.Select>
        </FloatingLabel>
        <FloatingLabel as={Col} label='Audio Input'>
          <Form.Select value={"default"}>
            <option value=""> Mute </option>
            {devices.filter((d) => { return d.kind === 'audioinput' }).
              map((d) => { return (<option value={d.deviceId}> {d.label} </option>) })}
          </Form.Select>
        </FloatingLabel>
        <FloatingLabel as={Col} label='Audio Output'>
          <Form.Select value={"default"}>
            <option value=""> Mute </option>
            {devices.filter((d) => { return d.kind === 'audiooutput' }).
              map((d) => { return (<option value={d.deviceId}> {d.label} </option>) })}
          </Form.Select>
        </FloatingLabel>
      </Row>
      <Col>
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
      </Col>


    </Form>
  )
}

export interface VideosProps {
  userID?: number
  localAudioTrack?: ILocalAudioTrack
  localVideoTrack?: ILocalVideoTrack
  remoteUsers?: IAgoraRTCRemoteUser[]
}

function Videos(props: VideosProps) {
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

export interface ChatsProps {
  userID?: number
  localAudioTrack?: ILocalAudioTrack
  localVideoTrack?: ILocalVideoTrack
  remoteUsers?: IAgoraRTCRemoteUser[]
  history?: string[],
  sendMessage: Function
}

function Chats(props: ChatsProps) {
  const [message, setMessage] = useState('');
  return (
    <div>
      {props.history?.map(str => <div>{str}</div>)}
      <div>
        {userID}:
        <input type='text' value={message} onChange={(event) => setMessage(event.target.value)} />
        <button onClick={() => { props.sendMessage(message); setMessage(''); }}>
          Send
        </button>
      </div>
    </div>
  )
}


function VideosB(props: any) {
  const [channel, setChannel] = useState('test-web-room');
  const [message, setMessage] = useState('');
  const { localAudioTrack, localVideoTrack, leave, join, joinState, remoteUsers } = useAgora(client);
  const rtm = useAgoraRTM();
  console.log(props.channel);
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
  )
}
