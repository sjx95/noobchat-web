require('dotenv').config({ path: __dirname + '/../.env.local' })
const appId = process.env.REACT_API_AGORA_APP_ID
const appCert = process.env.REACT_API_AGORA_APP_CERTIFICATE
if (!appId || !appCert) throw ('cannot load appId and appCert');

var http = require('http');
var url = require('url');
var {RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole} = require('agora-access-token');

http.createServer(function (req, res) {
    try {
        const q = url.parse(req.url, true);
        const channel = q.query.channel;
        const userId = parseInt(q.query.userId);
        const expire = 0;

        if (!channel || !userId) throw('bad request');
        const rtcToken = RtcTokenBuilder.buildTokenWithUid(appId, appCert, channel, userId, RtcRole.PUBLISHER, expire)
        const rtmToken = RtmTokenBuilder.buildToken(appId, appCert, userId.toString(), RtmRole.Rtm_User, expire);
        res.write(JSON.stringify({ appId, rtcToken, rtmToken, channel, userId, expire }));
    } catch (error) {
        res.writeHead(400);
    } finally {
        res.end();
    }
}).listen(8765);