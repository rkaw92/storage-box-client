import { CreateFilesystemParams, Filesystem, FilesystemsOperations } from '@rkaw92/storage-box-interfaces';
import { APIClient } from './interfaces/APIClient';

export class Filesystems implements FilesystemsOperations {
    private client: APIClient<unknown, unknown>;
    constructor(client: APIClient<unknown, unknown>) {
        this.client = client;
    }
    async listFilesystems(): Promise<Filesystem[]> {
        const filesystems: Filesystem[] = await this.client.call('/filesystems', 'GET');
        return filesystems;
    }
    async createFilesystem(params: CreateFilesystemParams): Promise<Filesystem> {
        const filesystem: Filesystem = await this.client.call('/filesystems', 'POST', params);
        return filesystem;
    }
};
