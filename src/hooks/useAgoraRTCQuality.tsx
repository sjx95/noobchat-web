import { IAgoraRTCClient, IAgoraRTCRemoteUser, NetworkQuality, RemoteAudioTrackStats, RemoteVideoTrackStats, UID } from "agora-rtc-sdk-ng";
import { useEffect, useState } from "react";

interface RemoteUserQualtiy {
    NetworkQuality?: NetworkQuality,
    VideoStats?: RemoteVideoTrackStats,
    AudioStats?: RemoteAudioTrackStats
};

export default function useAgroaRTCQuality(client: IAgoraRTCClient | undefined) {
    const [quality, setQuality] = useState<Map<UID, RemoteUserQualtiy>>(new Map());

    useEffect(() => {
        if (!client) {
            return
        }

        const update = function () {
            const rnq = client.getRemoteNetworkQuality();
            const rvs = client.getRemoteVideoStats();
            const ras = client.getRemoteAudioStats();
            const users = client.remoteUsers;

            const slice = users.map(function (user: IAgoraRTCRemoteUser): [UID, RemoteUserQualtiy] {
                return [user.uid, {
                    NetworkQuality: rnq[user.uid.toString()],
                    VideoStats: rvs[user.uid.toString()],
                    AudioStats: ras[user.uid.toString()],
                }];
            });

            setQuality(new Map(slice));
        };

        const h = setInterval(update, 1000);
        return () => {
            clearInterval(h);
            setQuality(new Map());
        }
    }, [client, setQuality])

    return quality;
}
