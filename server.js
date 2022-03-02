import { exec } from 'child_process';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const CUSTOM_HOSTS_PATH = process.env.CUSTOM_HOSTS_PATH;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const IP_REGEX = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/;
const HOST_REGEX = /^[a-zA-Z0-9\.]*$/;

const readExistingHostsRaw = () => {
    return fs.readFileSync(CUSTOM_HOSTS_PATH, 'utf-8');
};

const readExistingHosts = () => {
    try {
        const hosts = readExistingHostsRaw();
        if (!hosts) return [];
        const hostsList = hosts.split('\n').map(entry => {
            const tuple = entry.split(' ');
            return { ip: tuple[0], host: tuple[1] };
        });
        return hostsList;
    } catch (err) {
        console.log(err);
    };
};

const writeHosts = (hostList) => {
    const formattedHosts = hostList.map(hostEntry => `${hostEntry.ip} ${hostEntry.host}`).join('\n');
    fs.writeFileSync(CUSTOM_HOSTS_PATH, formattedHosts, 'utf8')
};

const addHost = (host) => {
    const hosts = readExistingHosts().filter(existingHost => existingHost.host != host.host);
    hosts.push(host);
    writeHosts(hosts);
};

const removeHost = (hostName) => {
    const existingHosts = readExistingHosts()
    const newHosts = existingHosts.filter(existingHost => existingHost.host != hostName);
    if (existingHosts.length === newHosts.length) {
        return false;
    }
    writeHosts(hosts);
    return true;
};

const reloadHosts = () => {
    exec('pkill -1 dnsmasq');
};

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "OK" })
});

app.use((req, res, next) => {
    if (!req.client.authorized) {
        return res.status(401).json({ errot: 'Not authorized' });
    }
    return next();
});

app.get("/reload", (req, res) => {
    reloadHosts();
    res.json({ status: "OK" })
});

app.get("/", (req, res) => {
    const hosts = readExistingHostsRaw().replace('\r\n', `</br>`);
    res.send(`<pre>${hosts}</pre>`);
});

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

app.delete("/:hostName", (req, res) => {
    const { hostName } = req.params;
    if (!hostName) return res.status(400).json({ error: "Invalid hostname supplied" });
    if (!removeHost(hostName)) return res.status(401).json({ error: "No host found" });
    reloadHosts();
    return res.status(200).json({ status: "Host deleted" });
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
