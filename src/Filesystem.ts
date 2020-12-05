import { CreateDirectoryParams, DeleteEntryParams, Entry, FilesystemStructureOperations, ListDirectoryParams, MoveEntryParams } from '@rkaw92/storage-box-interfaces';
import { APIClient } from './interfaces/APIClient';

export class Filesystem implements FilesystemStructureOperations {
    private client: APIClient;
    private alias: string;
    constructor(client: APIClient, alias: string) {
        this.client = client;
        this.alias = alias;
    }
    async createDirectory(params: CreateDirectoryParams): Promise<Entry> {
        return this.client.request(`/fs/${this.alias}/directory`, 'POST', params);
    }
    async listDirectory(params: ListDirectoryParams) {
        if (params.directoryID !== null) {
            return this.client.request(`/fs/${this.alias}/list/${params.directoryID}`, 'GET');
        } else {
            return this.client.request(`/fs/${this.alias}/list`, 'GET');
        }
    }
    async deleteEntry(params: DeleteEntryParams): Promise<void> {
        return this.client.request(`/fs/${this.alias}/entries/${params.entryID}`, 'DELETE');
    }
    async moveEntry(params: MoveEntryParams): Promise<void> {
        return this.client.request(`/fs/${this.alias}/entries/${params.entryID}/move`, 'POST', {
            targetParentID: params.targetParentID
        });
    }
}
