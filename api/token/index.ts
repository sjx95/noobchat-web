import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import "agora-access-token"
import { RtcRole, RtcTokenBuilder, RtmRole, RtmTokenBuilder } from "agora-access-token";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    try {
        let clientPrincipal: IClientPrinciple;

        try {
            clientPrincipal = JSON.parse(Buffer.from(req.headers['x-ms-client-principal'], 'base64').toString());
        } catch (err) {
            context.res = { status: 401, body: 'bad client principal' };
            return;
        }

        if (clientPrincipal.identityProvider !== 'github') {
            context.res = { status: 403, body: 'bad identity provider' };
            return;
        }

        const appId = process.env.REACT_APP_AGORA_APP_ID;
        const appCert = process.env.REACT_APP_AGORA_APP_CERTIFICATE;
        if (!appId || !appCert) {
            context.res = { status: 500, body: 'bad app_id and app_cert' };
            return;
        }

        const channel = req.query?.channel;
        const userId = parseInt(req.query?.userId);
        const expire = clientPrincipal.userRoles.includes('noob') ? 0 : Date.now() / 1000 + 300;
        if (!channel || !userId) {
            context.res = { status: 400, body: 'bad parameters' };
            return;
        }

        const rtcToken = RtcTokenBuilder.buildTokenWithUid(appId, appCert, channel, userId, RtcRole.PUBLISHER, expire)
        const rtmToken = RtmTokenBuilder.buildToken(appId, appCert, userId.toString(), RtmRole.Rtm_User, expire);
        context.res = {
            status: 200,
            body: { appId, rtcToken, rtmToken, channel, userId, expire },
        };
    } catch (error) {
        context.res = { status: 500, body: error };
        context.log.error(error);
    } finally {
        context.log.info('HTTP request: ', req, '\n', 'HTTP response: ', context.res);
    }
};

export default httpTrigger;

interface IClientPrinciple {
    identityProvider: string,
    userId: string,
    userDetails: string,
    userRoles: string[],
};
