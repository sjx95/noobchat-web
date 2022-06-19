import { AzureFunction, Context, HttpRequest, HttpResponse } from "@azure/functions"
import fetch from 'node-fetch';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<HttpResponse> {
    if (req.method !== 'POST')
        return { statusCode: 405 };

    if (!req.body?.requestUrl)
        return { statusCode: 400 };

    let request: URL
    try {
        request = new URL(req.body.requestUrl);
        if (!request.hostname.endsWith('azurestaticapps.net'))
            throw (new Error(`bad hostname: ${request.hostname}`));
    } catch (err) {
        return { statusCode: 400, body: err.message || err };
    }

    let redirect: URL
    try {
        const target = await fetch(request.href);
        if (target.status !== 200)
            throw (new Error(`bad response: ${target.statusText}`));
        redirect = new URL(target.url);
        if (!redirect.hostname.endsWith('github.com'))
            throw (new Error(`bad redirect target: ${redirect.href}`));
    } catch (err) {
        return { statusCode: 404, body: err.message || err };
    }

    return { statusCode: 200, body: { requestUrl: request.href, redirectUrl: redirect.href } };
};

export default httpTrigger;