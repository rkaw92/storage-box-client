import { Filesystem } from "./Filesystem.js";
import { Filesystems } from "./Filesystems.js";
import { NodeAPIClient } from "./NodeAPIClient.js";
import * as fs from 'fs';
import { ItemUploadStarted } from "@rkaw92/storage-box-interfaces";
import { Writable } from "stream";
import concatStream from "concat-stream";

const authToken = process.env.AUTH_TOKEN;
if (!authToken) {
    throw new Error('Missing env variable AUTH_TOKEN - please log in, obtain it, and pass to this process');
}

const client = new NodeAPIClient('http://localhost:3001/', authToken);
const filesystems = new Filesystems(client);
const play = new Filesystem(client, 'play');

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

(async function() {
    const fsList = await filesystems.listFilesystems();
    console.log('--- available filesystems ---');
    for (let filesystem of fsList) {
        console.log('* %s - %s', filesystem.alias, filesystem.name);
    }
})();

// NOTE: Not called
(async function() {
    const oldDir = await play.createDirectory({ parentID: null, name: 'Old Saves' });
    const newDir = await play.createDirectory({ parentID: null, name: 'Saves' });
    const sims = await play.createDirectory({ parentID: newDir.entryID, name: 'The Sims 3' });
    console.log('/:', await play.listDirectory({
        directoryID: null
    }));
    console.log('/Old Saves', await play.listDirectory({
        directoryID: oldDir.entryID
    }));
    console.log('/Saves', await play.listDirectory({
        directoryID: newDir.entryID
    }));
    console.log('-----------');
    await play.moveEntry({
        entryID: sims.entryID,
        targetParentID: oldDir.entryID
    });
    console.log('/:', await play.listDirectory({
        directoryID: null
    }));
    console.log('/Old Saves', await play.listDirectory({
        directoryID: oldDir.entryID
    }));
    console.log('/Saves', await play.listDirectory({
        directoryID: newDir.entryID
    }));
});

// NOTE: Not called
(async function() {
    const fd = fs.openSync('./testfile.date', 'r');
    const stream = fs.createReadStream('', { fd: fd });
    const uploads = await play.startFileUpload({
        files: [{
            type: 'application/octet-stream',
            name: 'testfile2.date',
            bytes: fs.fstatSync(fd).size,
            parentID: '20'
        }]
    });
    for (let uploadStart of uploads) {
        if (uploadStart.decision === 'upload') {
            await play.uploadFile({
                upload: {
                    data: stream,
                    token: (<ItemUploadStarted>uploadStart).token
                }
            });
        } else {
            console.log('Duplicate file - refusing upload');
        }
    }
});

// NOTE: Not called
(async function() {
    const download = await play.downloadFile({ entryID: '24' });
    console.log(download.info);
    console.log('--- contents: ---');
    const concatenator = concat();
    download.data.pipe(concatenator.stream);
    console.log((await concatenator.promise).toString());
});
