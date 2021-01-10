import { http, https } from 'follow-redirects';
import { APIClient, RequestMethod } from './interfaces/APIClient';
import urlJoin from 'url-join';
import concatStream from 'concat-stream';
import { Writable, Readable } from 'stream';
import { pipeline as pipelineCallback } from 'stream';
import { promisify } from 'util';
import { DownloadFileResult } from '@rkaw92/storage-box-interfaces';
import { IncomingMessage, RequestOptions } from 'http';

const pipeline = promisify(pipelineCallback);

function parseFileNameFromHeader(contentDisposition: string | undefined) {
    if (!contentDisposition) {
        return undefined;
    }
    const match = contentDisposition.match(/filename="([^"]*)"/);
    if (!match) {
        return undefined;
    }
    return match[1];
}

function isReadableStream(input: any): input is Readable {
    return (
        typeof input === 'object' &&
        input !== null && 
        typeof input.pipe === 'function'
    );
}

class HTTPClient {
    private isHTTPS: boolean;
    constructor(isHTTPS: boolean) {
        this.isHTTPS = isHTTPS;
    }
    request(url: string, options: RequestOptions, callback: (res: IncomingMessage) => void) {
        const targetURL = new URL(url);
        const finalOptions = Object.assign({}, options, {
            protocol: targetURL.protocol,
            hostname: targetURL.hostname,
            hash: targetURL.hash,
            search: targetURL.search,
            pathname: targetURL.pathname,
            path: targetURL.pathname + targetURL.search,
            href: targetURL.href,
            port: targetURL.port ? Number(targetURL.port) : undefined
        });
        if (this.isHTTPS) {
            // TODO: Figure out how to enable custom HTTPS options: CA
            return https.request(finalOptions, callback);
        } else {
            return http.request(finalOptions, callback);
        }
    }
}

class RequestError extends Error {
    public readonly statusCode: number;
    public readonly replyValue: any;
    constructor(path: string, statusCode: number, replyValue: any) {
        super(`Request to ${path} failed: statusCode = ${statusCode}, response body: ${JSON.stringify(replyValue)}`);
        this.statusCode = statusCode;
        this.replyValue = replyValue;
    }
}

export class NodeAPIClient implements APIClient<Readable,Readable> {
    private httpClient: HTTPClient;
    private baseURL: string;
    private authToken: string;
    constructor(baseURL: string, authToken: string) {
        this.baseURL = baseURL;
        const parsedURL = new URL(baseURL);
        const isHTTPS = (parsedURL.protocol === 'https:');
        this.httpClient = new HTTPClient(isHTTPS);
        this.authToken = authToken;
    }
    private async request(path: string, method: RequestMethod, body?: any) {
        const self = this;
        const targetURL = urlJoin(this.baseURL, path);
        return new Promise<IncomingMessage>(async function(resolve, reject) {
            const req = self.httpClient.request(targetURL, {
                method: method,
                headers: {
                    'Content-Type': isReadableStream(body) ? 'application/octet-stream' : 'application/json',
                    'Authorization': `Bearer ${self.authToken}`
                }
            }, function(res) {
                resolve(res);
            });
            req.on('error', function(error) {
                reject(error);
            });
            if (body) {
                if (isReadableStream(body)) {
                    await pipeline(body, req);
                } else {
                    req.end(JSON.stringify(body));
                }
            } else {
                req.end();
            }
        });
    }

    async call(path: string, method: RequestMethod, body?: any) {
        const res = await this.request(path, method, body);
        return new Promise<any>(function(resolve, reject) {
            res.pipe(concatStream(function(data) {
                let replyValue: any;
                try {
                    replyValue = JSON.parse(data.toString('utf-8'));
                } catch (error) {
                    replyValue = data.toString('utf-8');
                }
                if (res.statusCode! >= 200 && res.statusCode! < 300) {
                    resolve(replyValue);
                } else {
                    reject(new RequestError(path, res.statusCode!, replyValue));
                }
            }));
            res.on('error', function(error) {
                reject(error);
            });
        });
    }

    async download(path: string): Promise<DownloadFileResult<Readable>> {
        const res = await this.request(path, 'GET');
        return {
            data: res,
            info: {
                name: parseFileNameFromHeader(res.headers['content-disposition']),
                mimetype: res.headers['content-type'],
                bytes: res.headers['content-length'] ? Number(res.headers['content-length']) : undefined
            }
        };
    }
};
