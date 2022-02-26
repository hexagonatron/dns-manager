import { exec } from 'child_process';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const IP_REGEX = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/;
const HOST_REGEX = /^[a-zA-Z0-9\.]*$/;

const readExistingHostsRaw = () => {
    return fs.readFileSync('./hosts', 'utf-8');
}

const readExistingHosts = () => {
    try {
        const hosts = readExistingHostsRaw();
        const hostsList = hosts.split('\n').map(entry => {
            const tuple = entry.split(' ');
            return { ip: tuple[0], host: tuple[1] };
        });
        return hostsList;
    } catch (err) {
        console.log(err);
    }
}

const writeHosts = (hostList) => {
    const formattedHosts = hostList.map(hostEntry => `${hostEntry.ip} ${hostEntry.host}`).join('\n');
    fs.writeFileSync('./hosts', formattedHosts, 'utf8')
}

const addHost = (host) => {
    const hosts = readExistingHosts().filter(existingHost => existingHost.host != host.host);
    hosts.push(host);
    writeHosts(hosts);
}

const reloadHosts = () => {
    exec('');
}

app.use(express.json());

app.use((req, res, next) => {
    const cert = req.socket.getPeerCertificate();
    if (!req.client.authorized) {
        return res.status(401).json('Not authorized');
    }
    return next();
})

app.get("/", (req, res) => {
    const hosts = readExistingHostsRaw().replace('\r\n', `</br>`);
    res.send(`<pre>${hosts}</pre>`);
})

app.post("/", (req, res) => {
    console.log(req.body);

    const { ip, host } = req.body;
    const validIp = IP_REGEX.test(ip);
    const validHost = HOST_REGEX.test(host);
    if (!validHost || !validIp) {
        res.status(400).json({ error: 'Invalid parameters', validHost, validIp });
    }
    addHost({ host, ip });
    reloadHosts();
    return res.json({ pass: validHost && validIp });
});

const httpserver = https.createServer({
    key: fs.readFileSync('./keys/server_key.pem'),
    cert: fs.readFileSync('./keys/server_cert.pem'),
    requestCert: true,
    rejectUnauthorized: false,
    ca: [fs.readFileSync('./keys/server_cert.pem')],
}, app).listen(5300, () => {
    console.log('listening');
});