import * as http from 'http';
import * as https from 'https';
import { APIClient, RequestMethod } from './interfaces/APIClient';
import urlJoin from 'url-join';
import concatStream from 'concat-stream';
import { Writable, Readable } from 'stream';
import { pipeline as pipelineCallback } from 'stream';
import { promisify } from 'util';

const pipeline = promisify(pipelineCallback);

function concat() {
    let stream: Writable;
    let promise: Promise<Buffer>;
    promise = new Promise(function(resolve) {
        stream = concatStream(function(data) {
            resolve(data);
        });
    });
    return {
        stream: stream!,
        promise: promise
    };
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
    request(url: string, options: http.RequestOptions, callback: (res: http.IncomingMessage) => void) {
        if (this.isHTTPS) {
            // TODO: Figure out how to enable custom HTTPS options: CA
            return https.request(url, options, callback);
        } else {
            return http.request(url, options, callback);
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

export class NodeAPIClient implements APIClient<Readable> {
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
    async request(path: string, method: RequestMethod, body?: any) {
        const self = this;
        const targetURL = urlJoin(this.baseURL, path);
        return new Promise(async function(resolve, reject) {
            const req = self.httpClient.request(targetURL, {
                method: method,
                headers: {
                    'Content-Type': isReadableStream(body) ? 'application/octet-stream' : 'application/json',
                    'Authorization': `Bearer ${self.authToken}`
                }
            }, function(res) {
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
};
