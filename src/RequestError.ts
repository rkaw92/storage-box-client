export class RequestError extends Error {
    public readonly statusCode: number;
    public readonly replyValue: any;
    constructor(path: string, statusCode: number, replyValue: any) {
        super(`Request to ${path} failed: statusCode = ${statusCode}, response body: ${JSON.stringify(replyValue)}`);
        this.statusCode = statusCode;
        this.replyValue = replyValue;
    }
}
