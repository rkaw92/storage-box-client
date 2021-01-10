import { Filesystem } from "./Filesystem";
import { Filesystems } from "./Filesystems";
import { NodeAPIClient } from "./NodeAPIClient";
import * as fs from 'fs';
import { ItemUploadStarted } from "@rkaw92/storage-box-interfaces";

const authToken = process.env.AUTH_TOKEN;
if (!authToken) {
    throw new Error('Missing env variable AUTH_TOKEN - please log in, obtain it, and pass to this process');
}

const client = new NodeAPIClient('http://localhost:3001/', authToken);
const play = new Filesystem(client, 'play');

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
})();
