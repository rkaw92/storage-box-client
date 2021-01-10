import { CreateDirectoryParams, DeleteEntryParams, Entry, FilesystemDataUpload, FilesystemStructureOperations, ListDirectoryParams, MoveEntryParams, StartFileUploadParams, StartFileUploadResult, UploadFileParams, UploadFileResult } from '@rkaw92/storage-box-interfaces';
import { APIClient } from './interfaces/APIClient';

export class Filesystem<ReadableType> implements FilesystemStructureOperations, FilesystemDataUpload<ReadableType> {
    private client: APIClient<ReadableType>;
    private alias: string;
    constructor(client: APIClient<ReadableType>, alias: string) {
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
    async startFileUpload(params: StartFileUploadParams): Promise<StartFileUploadResult[]> {
        return this.client.request(`/fs/${this.alias}/upload`, 'POST', params);
    }
    async uploadFile(params: UploadFileParams<ReadableType>): Promise<UploadFileResult> {
        const parameterizedPath = `/fs/${this.alias}/upload/finish?token=${encodeURIComponent(params.upload.token)}`;
        return this.client.request(parameterizedPath, 'POST', params.upload.data);
    }
}
