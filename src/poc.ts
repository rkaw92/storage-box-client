import { Filesystems } from "./Filesystems";
import { NodeAPIClient } from "./NodeAPIClient";

const authToken = process.env.AUTH_TOKEN;
if (!authToken) {
    throw new Error('Missing env variable AUTH_TOKEN - please log in, obtain it, and pass to this process');
}

const client = new NodeAPIClient('http://localhost:3001/', authToken);
const filesystems = new Filesystems(client);
(async function() {
    const newFS = await filesystems.createFilesystem({
        name: 'Play',
        alias: 'play'
    });
    console.log('new FS:', newFS);
    const fsList = await filesystems.listFilesystems();
    console.log('all filesystems:', fsList);
})();
