import { Col, Container, Row } from 'react-bootstrap';
import { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { RtmChannel, RtmClient } from 'agora-rtm-sdk';
import { useWrappedState } from './hooks/useWrappedStates';
import { ChatController } from './ChatController';
import { ChatVideos } from './ChatVideos';
import { ChatTexts } from './ChatTexts';

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

  return (
    <Container fluid>
      <Row>
        <Col lg={3} xl={2}>
          <ChatController {...gs} />
        </Col>
        <Col lg={6} xl={8}>
          <ChatVideos userID={0}
            videoClient={gs.videoClient.value}
            remoteUsers={gs.rtcRemoteUsers.value}
            localVideoTrack={gs.localVideoTrack.value}
            localAudioTrack={gs.localAudioTrack.value}
          />
        </Col>
        <Col lg={3} xl={2}>
          <ChatTexts msgChannel={gs.msgChannel.value} />
        </Col>
      </Row>

    </Container>
  );
}

