import { RtmChannel, RtmMessage, RtmRawMessage } from "agora-rtm-sdk";
import { useEffect, useState } from "react";
import { filter, fromEvent, map, merge, of, Subscription, tap } from "rxjs";
import { IPublicUserInfo, useAzureAuth } from "./useAzureAuth";

export function useURP(userId: number, channel: RtmChannel | undefined): Map<number, IPublicUserInfo> | undefined {
    const selfInfo = useAzureAuth()?.publicUserInfo;
    const [userInfos, setUserInfos] = useState(new Map<number, IPublicUserInfo>());

    useEffect(() => {
        if (!channel) return;

        console.warn("registered, channel: ", channel);

        // const selfInfo: URPUserInfo | undefined = auth.publicUserInfo ? { agoraMemberId: userId, ...auth.publicUserInfo } : undefined;

        const sub = new Subscription();
        const memberJoin = fromEvent(channel, "MemberJoined").pipe(tap((x) => console.log('MemberJoined: ', x)));
        const memberLeft = fromEvent(channel, "MemberLeft").pipe(tap((x) => console.log('MemberLeft: ', x)));
        const rawMsg = fromEvent(channel, 'ChannelMessage').pipe(
            filter<[RtmMessage, string]>(
                ([msg]) => msg.messageType === 'RAW'
            ),
            map<[RtmMessage, string], [RtmRawMessage, number]>(
                ([msg, memberId]) => [msg as RtmRawMessage, parseInt(memberId)]
            ),
            tap((x) => console.info(x)),
        );

        sub.add(merge(of('0'), memberJoin)
            .subscribe(() => {
                if (!selfInfo) return;
                channel.sendMessage({
                    rawMessage: new Uint8Array(Buffer.from(JSON.stringify(selfInfo))),
                    description: "urp.notify",
                });
            }));

        sub.add(memberLeft
            .pipe(map((memberId: string) => parseInt(memberId)))
            .subscribe((memberId: number) => {
                setUserInfos((m) => { m?.delete(memberId); return m; });
            }));

        sub.add(rawMsg
            .pipe(filter(([msg]) => msg.description === 'urp.notify'))
            .subscribe(([msg, userId]) => {
                const remoteInfo: IPublicUserInfo = JSON.parse(new TextDecoder().decode(msg.rawMessage));
                setUserInfos((m) => { m?.set(userId, remoteInfo); return m });
            }));

        return () => {
            console.warn("unregistered, channel: ", channel);
            setUserInfos((m) => { m.clear(); return m });
            sub.unsubscribe();
        }
    }, [channel, selfInfo, userId])

    return userInfos;
}
