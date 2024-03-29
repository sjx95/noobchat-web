import { Col, Container, Row } from 'react-bootstrap';
import { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { RtmChannel, RtmClient } from 'agora-rtm-sdk';
import { useWrappedState } from './hooks/useWrappedStates';
import { ChatController, userID } from './ChatController';
import { ChatVideos } from './ChatVideos';
import { ChatTexts } from './ChatTexts';
import { useURP } from './hooks/useURP';

export default function Call() {

  const gs = {
    channel: useWrappedState('test-web-room'),
    videoInputDevice: useWrappedState(''),
    audioInputDevice: useWrappedState('default'),
    audioOutputDevice: useWrappedState('default'),
    subscribeVideo: useWrappedState(true),
    subscribeAudio: useWrappedState(true),


    joined: useWrappedState(false),

    videoClient: useWrappedState<IAgoraRTCClient | undefined>(undefined),
    msgClient: useWrappedState<RtmClient | undefined>(undefined),
    msgChannel: useWrappedState<RtmChannel | undefined>(undefined),

    rtcRemoteUsers: useWrappedState<IAgoraRTCRemoteUser[]>([]),
    localVideoTrack: useWrappedState<ICameraVideoTrack | undefined>(undefined),
    localAudioTrack: useWrappedState<IMicrophoneAudioTrack | undefined>(undefined),
  };

  const remoteUserInfo = useURP(gs.msgChannel.value);

  return (
    <Container fluid>
      <Row>
        <Col lg={3} xl={2}>
          <ChatController {...gs} />
        </Col>
        <Col lg={6} xl={8}>
          <ChatVideos userID={userID}
            videoClient={gs.videoClient.value}
            remoteUsers={gs.rtcRemoteUsers.value}
            localVideoTrack={gs.localVideoTrack.value}
            localAudioTrack={gs.localAudioTrack.value}
            remoteUserInfo={remoteUserInfo}
          />
        </Col>
        <Col lg={3} xl={2}>
          <ChatTexts userID={userID} msgChannel={gs.msgChannel.value} />
        </Col>
      </Row>

    </Container>
  );
}

