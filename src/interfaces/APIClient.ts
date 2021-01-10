import { DownloadFileResult } from "@rkaw92/storage-box-interfaces";

export type RequestMethod = "GET" | "POST" | "DELETE";

export interface APIClient<InputType,OutputType> {
    download(path: string): Promise<DownloadFileResult<OutputType>>;
    call(path: string, method: RequestMethod, body?: any): Promise<any>;
};
