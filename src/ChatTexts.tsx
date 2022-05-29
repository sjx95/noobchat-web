import { RtmChannel, RtmMessage } from "agora-rtm-sdk";
import { useEffect, useState } from "react";
import { userID } from "./ChatController";

export interface ChatTextsProps {
    userID?: number
    msgChannel?: RtmChannel
}

export function ChatTexts(props: ChatTextsProps) {

    const channel = props.msgChannel;
    const [edit, setEdit] = useState('');

    const [history, recordHistory, cleanHistory] = useHistory(20);
    useEffect(() => {
        if (!channel) {
            cleanHistory();
            return;
        }

        const onChannelMessage = (message: RtmMessage, memberId: string) => {
            if (message.messageType !== 'TEXT') return;
            recordHistory(memberId + ': ' + message.text);
        }

        channel.on('ChannelMessage', onChannelMessage);
        return () => {
            channel?.off('ChannelMessage', onChannelMessage);
        }
    }, [channel, recordHistory, cleanHistory]);

    async function sendMessage(text: string) {
        const channel = props.msgChannel;
        if (!channel) return;
        await channel.sendMessage({ text: text });
        recordHistory(userID + ': ' + text);
    }

    return (
        <div>
            {history?.map(str => <div>{str}</div>)}
            <div>
                {userID}:
                <input type='text' value={edit} onChange={(event) => setEdit(event.target.value)} />
                <button disabled={!channel} onClick={() => { sendMessage(edit); setEdit(''); }}>
                    Send
                </button>
            </div>
        </div>
    )
}

function useHistory(n: number): [string[], (msg: string) => void, () => void] {
    const [history, setHistory] = useState<string[]>([]);
    const record = (msg: string) => setHistory([...history, msg].slice(-n));
    const clean = () => { if (history.length > 0) setHistory([]); };
    return [history, record, clean];
}