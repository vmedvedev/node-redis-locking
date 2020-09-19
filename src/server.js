'use strict';

const http = require('http');
const url = require('url');
const Redis = require("ioredis");
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const redis = new Redis(process.env.REDIS_PORT, REDIS_HOST);
const { executeLater, pollQueue, watchQueue } = require('./example');
const queue = 'messages';

http.createServer(function (req, res) {
    const q = url.parse(req.url, true).query;
    const msg = q.message;

    executeLater(redis, 'messages', 'printMessage', {message: msg}, 3000)
    .then((identifier) => {
        console.log("Queue item identifier: %s", identifier);
    });

    res.end();
}).listen(8080);

pollQueue(redis, 100);
watchQueue(redis, queue, 100);
