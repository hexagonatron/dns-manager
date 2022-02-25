import { exec } from 'child_process';
import express from 'express';
import fs from 'fs';
import path from 'path';
import {URL} from 'url';

const __dirname = new URL('.', import.meta.url).pathname
const app = express();

const IP_REGEX = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/;
const HOST_REGEX = /^[a-zA-Z0-9\.]*$/;

const readExistingHosts =  () => {
    const hosts = fs.readFileSync('./hosts', 'utf-8');
    const hostsList = hosts.split('\n').map(entry => {
        const tuple = entry.split(' ');
        return {ip: tuple[0], host: [tuple[1]]};
    });
    return hostsList;
}

const writeHosts = (hostList) => {
    const formattedHosts = hostList.map(hostEntry => `${hostEntry.ip} ${hostEntry.host}`).join('\n');
    fs.writeFileSync('./hosts', formattedHosts, 'utf8' )
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

app.get("/", (req, res) => {
    const hosts = readExistingHosts();
    res.sendFile(path.resolve(__dirname,'hosts'));
})

app.post("/", (req, res) => {
    console.log(req.body);

    const {ip, host} = req.body;
    const validIp = IP_REGEX.test(ip);
    const validHost = HOST_REGEX.test(host);
    if (!validHost || !validIp) {
        res.status(400).json({error: 'Invalid parameters', validHost, validIp});
    }
    addHost({host, ip});
    reloadHosts();
    return res.json({pass: validHost && validIp});
});

app.listen(5300, () => {
    console.log("listening");
})