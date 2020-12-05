export type RequestMethod = "GET" | "POST" | "DELETE";

export interface APIClient {
    request(path: string, method: RequestMethod, body?: any): Promise<any>;
};
