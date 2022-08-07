import { RtmChannel, RtmMessage, RtmRawMessage } from "agora-rtm-sdk";
import { useEffect, useState } from "react";
import { filter, fromEvent, map, merge, of, Subscription, tap } from "rxjs";
import { IPublicUserInfo, useAzureAuth } from "./useAzureAuth";

export function useURP(channel: RtmChannel | undefined): Map<string, IPublicUserInfo> | undefined {
    const selfInfo = useAzureAuth()?.publicUserInfo;
    const [userInfos, setUserInfos] = useState(new Map<string, IPublicUserInfo>());

    useEffect(() => {
        if (!channel) return;

        const sub = new Subscription();
        const memberJoin = fromEvent<string>(channel, "MemberJoined").pipe(tap((x) => console.info('MemberJoined: ', x)));
        const memberLeft = fromEvent<string>(channel, "MemberLeft").pipe(tap((x) => console.info('MemberLeft: ', x)));
        const rawMsg = fromEvent<[RtmMessage, string]>(channel, 'ChannelMessage').pipe(
            filter<[RtmMessage, string]>(
                ([msg]) => msg.messageType === 'RAW'
            ),
            map<[RtmMessage, string], [RtmRawMessage, string]>(
                ([msg, memberId]) => [msg as RtmRawMessage, memberId]
            ),
            tap(([msg, memberId]) => console.info('ChannelMessage from ', memberId, ': ', new TextDecoder().decode(msg.rawMessage))),
        );

        sub.add(merge(of('0'), memberJoin)
            .subscribe(() => {
                if (!selfInfo) return;
                channel.sendMessage({
                    rawMessage: new TextEncoder().encode(JSON.stringify(selfInfo)),
                    description: "urp.notify",
                });
            }));

        sub.add(memberLeft
            .subscribe((memberId: string) => {
                setUserInfos((m) => { m?.delete(memberId); return m; });
            }));

        sub.add(rawMsg
            .pipe(filter(([msg]) => msg.description === 'urp.notify'))
            .subscribe(([msg, memberId]) => {
                const remoteInfo: IPublicUserInfo = JSON.parse(new TextDecoder().decode(msg.rawMessage));
                setUserInfos((m) => { m?.set(memberId, remoteInfo); return m });
            }));

        console.info("URP registered on RtmChannel: ", channel);
        return () => {
            sub.unsubscribe();
            setUserInfos(new Map());
            console.info("URP unregistered on RtmChannel: ", channel);
        }
    }, [channel, selfInfo])

    return userInfos;
}
