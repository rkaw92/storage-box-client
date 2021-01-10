import { CreateDirectoryParams, DeleteEntryParams, DownloadFileParams, DownloadFileResult, Entry, FilesystemDataDownload, FilesystemDataUpload, FilesystemStructureOperations, ListDirectoryParams, MoveEntryParams, StartFileUploadParams, StartFileUploadResult, UploadFileParams, UploadFileResult } from '@rkaw92/storage-box-interfaces';
import { APIClient } from './interfaces/APIClient';

export class Filesystem<InputType,OutputType> implements FilesystemStructureOperations, FilesystemDataUpload<InputType>, FilesystemDataDownload<OutputType> {
    private client: APIClient<InputType,OutputType>;
    private alias: string;
    constructor(client: APIClient<InputType,OutputType>, alias: string) {
        this.client = client;
        this.alias = alias;
    }
    async createDirectory(params: CreateDirectoryParams): Promise<Entry> {
        return this.client.call(`/fs/${this.alias}/directory`, 'POST', params);
    }
    async listDirectory(params: ListDirectoryParams) {
        if (params.directoryID !== null) {
            return this.client.call(`/fs/${this.alias}/list/${params.directoryID}`, 'GET');
        } else {
            return this.client.call(`/fs/${this.alias}/list`, 'GET');
        }
    }
    async deleteEntry(params: DeleteEntryParams): Promise<void> {
        return this.client.call(`/fs/${this.alias}/entries/${params.entryID}`, 'DELETE');
    }
    async moveEntry(params: MoveEntryParams): Promise<void> {
        return this.client.call(`/fs/${this.alias}/entries/${params.entryID}/move`, 'POST', {
            targetParentID: params.targetParentID
        });
    }
    async startFileUpload(params: StartFileUploadParams): Promise<StartFileUploadResult[]> {
        return this.client.call(`/fs/${this.alias}/upload`, 'POST', params);
    }
    async uploadFile(params: UploadFileParams<InputType>): Promise<UploadFileResult> {
        const parameterizedPath = `/fs/${this.alias}/upload/finish?token=${encodeURIComponent(params.upload.token)}`;
        return this.client.call(parameterizedPath, 'POST', params.upload.data);
    }
    async downloadFile(params: DownloadFileParams): Promise<DownloadFileResult<OutputType>> {
        return this.client.download(`/fs/${this.alias}/download/${params.entryID}`);
    }
}
