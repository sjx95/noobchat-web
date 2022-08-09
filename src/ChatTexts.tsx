import { RtmChannel, RtmMessage, RtmTextMessage } from "agora-rtm-sdk";
import { useEffect, useState } from "react";
import { filter, fromEvent, map, merge, scan, Subject, Subscription } from "rxjs";
import { IPublicUserInfo, useAzureAuth } from "./hooks/useAzureAuth";

export interface ChatTextsProps {
    userID: number
    msgChannel?: RtmChannel
    remoteUserInfos?: Map<string, IPublicUserInfo>
}

export function ChatTexts(props: ChatTextsProps) {

    const channel = props.msgChannel;
    const remoteUserInfos = props.remoteUserInfos;
    const [edit, setEdit] = useState('');
    const [sender, setSender] = useState<Subject<RtmTextMessage>>();
    const [history, setHistory] = useState<IChatHistory[]>([]);

    useEffect(() => {
        if (!channel) {
            setHistory([]);
            return;
        }

        const sub = new Subscription();
        const sender = new Subject<RtmTextMessage>();
        setSender(sender);
        sub.add(sender.subscribe((msg) => channel.sendMessage(msg)));

        const msgRecv = fromEvent<[RtmMessage, string]>(channel, 'ChannelMessage').pipe(
            filter(([msg]) => msg.messageType === 'TEXT'),
            map(([msg, memberId]) => ({ msg: msg as RtmTextMessage, memberId })),
        );

        const msgSend = sender.pipe(
            map((msg) => ({ msg, memberId: props.userID.toString() })),
        );

        sub.add(merge(msgRecv, msgSend).pipe(
            scan((acc, value) => [value, ...acc.slice(0, 19)], Array<IChatHistory>()),
            map((x) => x.reverse()),
        ).subscribe(
            (x) => setHistory(x)
        ));

        return () => {
            sub.unsubscribe();
        }
    }, [channel, props.userID]);

    const selfInfo = useAzureAuth().publicUserInfo;

    return (
        <div>
            <>
                {history?.map(x => ({ ...x, publicUserInfo: x.memberId === props.userID.toString() ? selfInfo : remoteUserInfos?.get(x.memberId) }))
                    .map(({ msg, memberId, publicUserInfo }) =>
                        <div>
                            {publicUserInfo ? <img src={publicUserInfo.avatar_url} alt='' width='32' /> : <></>}
                            {publicUserInfo?.name ?? publicUserInfo?.login ?? 'remoteUser'} ({memberId})
                            :{msg.text}
                        </div>
                    )}
            </>
            <div>
                {selfInfo ? <img src={selfInfo.avatar_url} alt='' width='32' /> : <></>}
                {selfInfo?.name ?? selfInfo?.login ?? 'localUser'} ({props.userID}):
                <input type='text' value={edit} onChange={(event) => setEdit(event.target.value)} />
                <button disabled={!channel || !edit} onClick={() => { sender?.next({ text: edit }); setEdit(''); }}>
                    Send
                </button>
            </div>
        </div>
    )
}

interface IChatHistory {
    msg: RtmTextMessage
    memberId: string
}