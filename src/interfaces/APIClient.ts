export type RequestMethod = "GET" | "POST" | "DELETE";

export interface APIClient<ReadableType> {
    request(path: string, method: RequestMethod, body?: any): Promise<any>;
};
