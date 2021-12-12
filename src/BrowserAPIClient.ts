import { DownloadFileResult } from '@rkaw92/storage-box-interfaces';
import { APIClient, RequestMethod } from './interfaces/APIClient.js';
import { RequestError } from './RequestError.js';

function parseFileNameFromHeader(contentDisposition: string | null) {
  if (!contentDisposition) {
      return undefined;
  }
  const match = contentDisposition.match(/filename="([^"]*)"/);
  if (!match) {
      return undefined;
  }
  return match[1];
}

export class BrowserAPIClient implements APIClient<unknown, Blob> {
  private baseURL: string;
  private authToken: string;
  constructor(baseURL: string, authToken: string) {
    this.baseURL = baseURL;
    this.authToken = authToken;
  }
  private getURL(path: string) {
    let baseURL = this.baseURL;
    if (baseURL[baseURL.length - 1] === '/') {
      baseURL = baseURL.slice(0, -1);
    }
    return baseURL + path;
  }
  private async request(path: string, method: RequestMethod, body?: any) {
    const requestURL = this.getURL(path);
    const response = await fetch(requestURL, {
      method: method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      }
    });
    return response;
  }
  private async handleError(path: string, response: Response) {
    const errorData = await response.json();
    throw new RequestError(path, response.status, errorData);
  }
  async call(path: string, method: RequestMethod, body?: any): Promise<any> {
    const response = await this.request(path, method, body);
    if (response.ok) {
      const responseData = await response.json();
      return responseData;
    } else {
      await this.handleError(path, response);
    }
  }
  async download(path: string): Promise<DownloadFileResult<Blob>> {
    const response = await this.request(path, 'GET');
    if (!response.ok) {
      await this.handleError(path, response);
    }
    return {
      data: await response.blob(),
      info: {
          name: parseFileNameFromHeader(response.headers.get('content-disposition')),
          mimetype: response.headers.get('content-type') || 'application/octet-stream',
          bytes: response.headers.get('content-length') ? Number(response.headers.get('content-length')) : undefined
      }
    }
  }
}
