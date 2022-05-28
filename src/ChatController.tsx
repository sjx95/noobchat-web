import { RtcRole, RtcTokenBuilder, RtmTokenBuilder, RtmRole } from "agora-access-token"
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, ILocalVideoTrack } from "agora-rtc-sdk-ng"
import AgoraRTM, { RtmClient, RtmChannel } from "agora-rtm-sdk"
import { useState, useEffect } from "react"
import { Form, Row, Col, FloatingLabel, Button } from "react-bootstrap"
import { IWrappedState } from "./hooks/useWrappedStates"

const appID = process.env.REACT_APP_AGORA_APP_ID ?? ""
const appCertificate = process.env.REACT_APP_AGORA_APP_CERTIFICATE ?? ""

const client = AgoraRTC.createClient({ codec: 'h264', mode: 'rtc' });
const msgClient = AgoraRTM.createInstance(appID);

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

interface ChatControllerProps {
  channel: IWrappedState<string>
  joined: IWrappedState<boolean>
  videoClient: IWrappedState<IAgoraRTCClient | undefined>
  msgClient: IWrappedState<RtmClient | undefined>
  msgChannel: IWrappedState<RtmChannel | undefined>
};

export function ChatController(props: ChatControllerProps) {

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  useEffect(() => { updateDevices(); }, [])
  async function updateDevices() {
    const ds = await AgoraRTC.getDevices();
    setDevices(ds);
  }

  const [videoInput, setVideoInput] = useState('');
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack>();
  useEffect(() => {
    if (!props.videoClient.value || videoInput === '') {
      props.videoClient.value?.unpublish(localVideoTrack);
      localVideoTrack?.close();
      setLocalVideoTrack(undefined);
      return;
    }

    if (videoInput !== '') {
      if (!localVideoTrack) {
        AgoraRTC.createCameraVideoTrack({ cameraId: videoInput }).then((track) => {
          setLocalVideoTrack(track);
          props.videoClient.value?.publish(track);
        });
      } else {
        localVideoTrack.setDevice(videoInput);
      }
    }
  }, [props.videoClient.value, videoInput, localVideoTrack, setLocalVideoTrack]);

  async function join() {
    // if (!props.videoClient.value || !props.msgClient.value) return;

    const channelName = props.channel.value;

    await client.join(appID, channelName, genRTCToken(channelName), userID);
    props.videoClient.set(client);

    await msgClient.login({ uid: userID.toString(), token: genRTMToken() });
    props.msgClient.set(msgClient);

    const channel = msgClient.createChannel(channelName);
    await channel.join();

    props.msgChannel.set(channel);
    props.joined.set(true);
  }

  async function leave() {
    await props.msgChannel.value?.leave();
    props.msgChannel.set(undefined);

    await props.msgClient.value?.logout();
    props.msgClient.set(undefined);

    await props.videoClient.value?.leave();
    props.videoClient.set(undefined);

    props.joined.set(false);
  }

  return (
    <Form>
      <Row>
        <Col> Room Control</Col>
      </Row>
      <Row>
        <Col xs={6} md={8} lg={12}>
          <FloatingLabel label='Channel' controlId='channel'>
            <Form.Control placeholder="test-web-room"
              value={props.channel.value}
              onChange={(e) => { props.channel.set(e.target.value) }}
              disabled={props.joined.value} />
          </FloatingLabel>
        </Col>
        <Col xs={6} md={4} lg={12}>
          <Row xs={2} style={{ height: '100%' }}>
            <Col>
              <Button style={{ height: '100%', width: '100%', alignItems: 'stretch' }}
                onClick={join}
                disabled={props.joined.value}>
                Join
              </Button>
            </Col>
            <Col>
              <Button style={{ height: '100%', width: '100%', alignItems: 'stretch' }}
                onClick={leave}
                disabled={!props.joined.value}>
                Leave
              </Button>
            </Col>
          </Row>
        </Col>
      </Row >
      <Row>
        <Col> Local Device Control</Col>
      </Row>
      <Row xs={2} md={4} lg={1} style={{ alignItems: 'stretch' }}>
        <Col>
          <Button style={{ height: '100%', width: '100%', alignItems: 'stretch' }}>
            Refresh Devices
          </Button>
        </Col>
        <FloatingLabel as={Col} label='Video Input'>
          <Form.Select value={videoInput} onChange={(e) => setVideoInput(e.target.value)}>
            <option value=""> Disable </option>
            {devices.filter((d) => { return d.kind === 'videoinput' }).
              map((d) => { return (<option key={d.deviceId} value={d.deviceId}> {d.label} </option>) })}
          </Form.Select>
        </FloatingLabel>
        <FloatingLabel as={Col} label='Audio Input'>
          <Form.Select value={"default"}>
            <option value=""> Mute </option>
            {devices.filter((d) => { return d.kind === 'audioinput' }).
              map((d) => { return (<option key={d.deviceId} value={d.deviceId}> {d.label} </option>) })}
          </Form.Select>
        </FloatingLabel>
        <FloatingLabel as={Col} label='Audio Output'>
          <Form.Select value={"default"}>
            <option value=""> Mute </option>
            {devices.filter((d) => { return d.kind === 'audiooutput' }).
              map((d) => { return (<option key={d.deviceId} value={d.deviceId}> {d.label} </option>) })}
          </Form.Select>
        </FloatingLabel>
      </Row>
      <Row>
        <Col> Advance Control</Col>
      </Row>
      <Row>
        <Col>
          <Form.Switch label={`Mute Local Audio`} />
          <Form.Switch label={`Mute Remote Audio`} />
          <Form.Switch label={`Subscribe Remote Video`} />
          <Form.Switch label={`Subscribe Remote Audio`} />
        </Col>
      </Row>
    </Form >
  )
}