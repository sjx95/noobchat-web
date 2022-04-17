import { useState, useEffect } from 'react';
import AgoraRTM, { RtmChannel, RtmClient, RtmMessage } from 'agora-rtm-sdk';

export default function useAgoraRTM(): {
    joinState: boolean,
    leave: Function,
    join: Function,
    sendMessage: Function,
    history: string[],
} {
    const [client, setClient] = useState<RtmClient | undefined>(undefined);
    const [channel, setChannel] = useState<RtmChannel | undefined>(undefined);
    const [joinState, setJoinState] = useState(false);
    const [history, recHistory, cleanHistory] = useHistory(20);
    const [myMemberId, setMyMemberId] = useState('');

    async function join(appID: string, channelID: string, userId: string, token?: string) {
        setMyMemberId(userId);
        let client = AgoraRTM.createInstance(appID);
        await client.login({ uid: userId, token: token }).then(() => setClient(client));

        let channel = client.createChannel(channelID);
        await channel.join().then(() => setChannel(channel));

        setJoinState(true);
    }

    async function leave() {
        await channel?.leave().then(() => setChannel(undefined));
        await client?.logout().then(() => setClient(undefined));
        setJoinState(false);
    }

    async function sendMessage(text: string) {
        if (!channel) return;
        await channel.sendMessage({ text: text });
        recHistory(myMemberId + ': ' + text);
    }

    useEffect(() => {
        if (!channel) {
            cleanHistory();
            return;
        }

        const onChannelMessage = (message: RtmMessage, memberId: string) => {
            if (message.messageType !== 'TEXT') return;
            recHistory(memberId + ': ' + message.text);
        }

        channel.on('ChannelMessage', onChannelMessage);
        return () => {
            channel?.off('ChannelMessage', onChannelMessage);
        }
    }, [channel, recHistory, cleanHistory])

    return {
        joinState,
        leave,
        join,
        sendMessage,
        history,
    };
}

function useHistory(n: number): [string[], (msg: string) => void, () => void] {
    const [history, setHistory] = useState<string[]>([]);
    return [history, (msg) => setHistory([...history, msg].slice(-n)), () => setHistory([])];
}