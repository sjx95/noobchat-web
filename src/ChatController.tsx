import { RtcRole, RtcTokenBuilder, RtmTokenBuilder, RtmRole } from "agora-access-token"
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack, MicrophoneAudioTrackInitConfig } from "agora-rtc-sdk-ng"
import AgoraRTM, { RtmClient, RtmChannel } from "agora-rtm-sdk"
import { useState, useEffect, useContext } from "react"
import { Form, Row, Col, FloatingLabel, Button, Modal, Alert } from "react-bootstrap"
import { AuthContext } from "./hooks/useAzureAuth"
import { IWrappedState } from "./hooks/useWrappedStates"

export const userID = Math.floor(Math.random() * (1 << 31 - 1));

interface ChatControllerProps {
  channel: IWrappedState<string>
  joined: IWrappedState<boolean>
  videoClient: IWrappedState<IAgoraRTCClient | undefined>
  msgClient: IWrappedState<RtmClient | undefined>
  msgChannel: IWrappedState<RtmChannel | undefined>

  rtcRemoteUsers: IWrappedState<IAgoraRTCRemoteUser[]>
  localAudioTrack: IWrappedState<IMicrophoneAudioTrack | undefined>
  localVideoTrack: IWrappedState<ICameraVideoTrack | undefined>
};

export function ChatController(props: ChatControllerProps) {

  useEffect(() => {
    const client = props.videoClient.value;
    const setRemoteUsers = props.rtcRemoteUsers.set;
    if (!client) return;

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

    client.remoteUsers.map(async (user) => {
      user.hasAudio && !user.audioTrack && await client.subscribe(user, 'audio');
      user.hasVideo && !user.videoTrack && await client.subscribe(user, 'video');
      setRemoteUsers(client.remoteUsers);
    });

    return () => {
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
      client.off('user-joined', handleUserJoined);
      client.off('user-left', handleUserLeft);
      setRemoteUsers([]);
    };
  }, [props.videoClient.value, props.rtcRemoteUsers.set]);




  return (
    <Form>
      <RoomController {...props} />
      <DeviceController {...props} />
      <Row hidden>
        <Col> Advance Control</Col>
      </Row>
      <Row hidden>
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

function RoomController(props: ChatControllerProps) {

  const auth = useContext(AuthContext);
  const hiddenAppCertInput: boolean = auth.clientPrinciple || (process.env.REACT_APP_AGORA_APP_ID && process.env.REACT_APP_AGORA_APP_CERTIFICATE) ? true : false;
  const [appId, setAppId] = useState(process.env.REACT_APP_AGORA_APP_ID ?? "");
  const [appCert, setAppCert] = useState(process.env.REACT_APP_AGORA_APP_CERTIFICATE ?? "");
  const [errMsg, setErrMsg] = useState<string>();


  async function join() {

    function genToken(channel: string, userId: number): [string, string, string] {
      return [appId,
        RtcTokenBuilder.buildTokenWithUid(appId, appCert, channel, userId, RtcRole.PUBLISHER, 0),
        RtmTokenBuilder.buildToken(appId, appCert, userId.toString(), RtmRole.Rtm_User, 0),
      ]
    }

    async function fetchToken(channel: string, userId: number): Promise<[string, string, string]> {
      const res = await fetch(`/api/token?channel=${channel}&userId=${userId}`)
      const { appId, rtcToken, rtmToken } = await res.json();
      return [appId, rtcToken, rtmToken]
    }

    try {
      const channel = props.channel.value;
      const [appId, rtcToken, rtmToken] = auth.clientPrinciple ?
        await fetchToken(channel, userID) : genToken(channel, userID);
      const videoClient = AgoraRTC.createClient({ codec: 'h264', mode: 'rtc' });
      const msgClient = AgoraRTM.createInstance(appId);

      await videoClient.join(appId, channel, rtcToken, userID);
      await msgClient.login({ uid: userID.toString(), token: rtmToken });
      const msgChannel = msgClient.createChannel(channel);
      await msgChannel.join();

      props.videoClient.set(videoClient);
      props.msgClient.set(msgClient);
      props.msgChannel.set(msgChannel);

      props.joined.set(true);
    } catch (e) {
      setErrMsg(String(e));
    }

  }

  async function leave() {
    try {
      props.msgChannel.set(undefined);
      props.msgClient.set(undefined);
      props.videoClient.set(undefined);

      await props.msgChannel.value?.leave();
      await props.msgClient.value?.logout();
      await props.videoClient.value?.leave();

      props.joined.set(false);
    } catch (e) {
      setErrMsg(String(e));
    }
  }

  return (
    <>
      <Row>
        <Col>Room Control</Col>
      </Row>
      <Row>
        <Col>
          <Alert variant="info" show={!!process.env.REACT_APP_AZURE_AUTH && !auth.clientPrinciple && !hiddenAppCertInput}>
            Please <Alert.Link href="/.auth/login/github">login</Alert.Link> with GitHub account,
            or join with yourselves Agora AppID.
          </Alert>
        </Col>
      </Row>
      <Row>
        <Col xs={6} md={3} lg={12} hidden={hiddenAppCertInput}>
          <FloatingLabel label='AppID' controlId='appId'>
            <Form.Control placeholder="appId"
              onChange={(e) => { setAppId(e.target.value) }}
              disabled={props.joined.value || hiddenAppCertInput} />
          </FloatingLabel>
        </Col>
        <Col xs={6} md={3} lg={12} hidden={hiddenAppCertInput}>
          <FloatingLabel label='AppCertification' controlId='appCertification'>
            <Form.Control placeholder="appCertification"
              type="password"
              onChange={(e) => { setAppCert(e.target.value) }}
              disabled={props.joined.value || hiddenAppCertInput} />
          </FloatingLabel>
        </Col>
        <Col xs={6} md={true} lg={12}>
          <FloatingLabel label='Channel' controlId='channel'>
            <Form.Control placeholder="test-web-room" required
              value={props.channel.value}
              onChange={(e) => { props.channel.set(e.target.value) }}
              disabled={props.joined.value} />
          </FloatingLabel>
        </Col>
        <Col xs={6} md={3} lg={12}>
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
      </Row>
      <Modal show={Boolean(errMsg)} onHide={() => setErrMsg(undefined)}>
        <Modal.Header closeButton>
          <Modal.Title> Error </Modal.Title>
        </Modal.Header>
        <Modal.Body>{errMsg}</Modal.Body>
      </Modal>
    </>
  )
}

function DeviceController(props: ChatControllerProps) {

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  useEffect(() => { updateDevices(); }, [])
  async function updateDevices() {
    const ds = await AgoraRTC.getDevices();
    setDevices(ds);
  }

  const [videoInput, setVideoInput] = useState('');
  const { value: localVideoTrack, set: setLocalVideoTrack } = props.localVideoTrack;
  useEffect(() => {
    if (!props.videoClient.value || videoInput === '') {
      !localVideoTrack || props.videoClient.value?.unpublish(localVideoTrack);
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

  const [audioInput, setAudioInput] = useState('default');
  const { value: localAudioTrack, set: setLocalAudioTrack } = props.localAudioTrack;
  useEffect(() => {
    if (!props.videoClient.value || audioInput === '') {
      !localAudioTrack || props.videoClient.value?.unpublish(localAudioTrack);
      localAudioTrack?.close();
      setLocalAudioTrack(undefined);
      return;
    }

    if (audioInput !== '') {
      if (!localAudioTrack) {
        const miccfg: MicrophoneAudioTrackInitConfig = { microphoneId: audioInput, AEC: true, AGC: true, ANS: true };
        AgoraRTC.createMicrophoneAudioTrack(miccfg).then((track) => {
          setLocalAudioTrack(track);
          props.videoClient.value?.publish(track);
        });
      } else {
        localAudioTrack.setDevice(audioInput);
      }
    }
  }, [props.videoClient.value, audioInput, localAudioTrack, setLocalAudioTrack]);

  return (
    <>
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
            {devices.filter((d) => { return d.kind === 'videoinput' })
              .map((d) => { return (<option key={d.deviceId} value={d.deviceId}> {d.label} </option>) })}
          </Form.Select>
        </FloatingLabel>
        <FloatingLabel as={Col} label='Audio Input'>
          <Form.Select value={audioInput} onChange={(e) => setAudioInput(e.target.value)}>
            <option value=""> Mute </option>
            {devices.filter((d) => { return d.kind === 'audioinput' })
              .map((d) => { return (<option key={d.deviceId} value={d.deviceId}> {d.label} </option>) })}
          </Form.Select>
        </FloatingLabel>
        <FloatingLabel as={Col} label='Audio Output' hidden>
          <Form.Select value={"default"}>
            <option value=""> Mute </option>
            {devices.filter((d) => { return d.kind === 'audiooutput' })
              .map((d) => { return (<option key={d.deviceId} value={d.deviceId}> {d.label} </option>) })}
          </Form.Select>
        </FloatingLabel>
      </Row>
    </>
  );
}