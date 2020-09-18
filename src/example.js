'use strict';

const { v4: uuidv4 } = require('uuid');
const Promise = require("bluebird");
const acquireLock = require('./acquireLock');
const releaseLock = require('./releaseLock');

/**
 * Adds command to the delayed queue.
 *
 * @param redis Redis client, instance of ioredis.
 * @param queue Commands queue name.
 * @param name Cammand name (function name).
 * @param args Arguments for command.
 * @param delay Delay of execution in milliseconds.
 * @return Unique identifier of queue item.
 **/
const executeLater = async (redis, queue, name, args, delay) => {
    // Generate a unique identifier.
    const identifier = uuidv4();
     //Prepare the item for the queue.
    const item = JSON.stringify({identifier, queue, name, args});

    if (delay > 0) {
        // Delay the item.
        await redis.zadd('delayed:', Date.now() + delay, item);
    } else {
        // Execute the item immediately.
        await redis.rpush('queue:' + queue, item);
    }

    return identifier;
};

/**
 * Polls delayed queue.
 *
 * @param redis Redis client, instance of ioredis.
 * @param sleepTime Halt time in milliseconds.
 **/
const pollQueue = async (redis, sleepTime) => {
    let item;
    let identifier;
    let queue;

    // Get the first item in the queue.
    await redis.zrange('delayed:', 0, 0, "WITHSCORES")
    .then(async (record) => {
        if (record && record.length > 1) {
            const delay = record[1];
            item = record[0];
            if (delay <= Date.now()) {
                // Unpack the item.
                const itemObj = JSON.parse(item);
                identifier = itemObj.identifier;
                queue = itemObj.queue;
                const timeout = 10000; // 10 seconds
                // Get the lock for the item.
                return await acquireLock(redis, identifier, timeout);
            }
        }
    })
    .then(async (locked) => {
        if (locked) {
            return await redis.zrem('delayed:', item)
            .then(async (result) => {
                if (result > 0) {
                    // Move the item to the proper list queue.
                    return await redis.rpush('queue:' + queue, item);
                }
                return 0;
            })
            .then(async (result) => {
                if (result > 0) {
                    // Release the lock.
                    await releaseLock(redis, identifier, locked);
                }
            })
        }
    })
    .catch((err) => console.error(err));

    return Promise.delay(sleepTime).then(async () => await pollQueue(redis));
};

const commadsList = {
    printMessage: (args) => {
        console.log(args.message);
    }
};

/**
 * Watches given list queue by name.
 *
 * @param redis Redis client, instance of ioredis.
 * @param queue Queue name.
 * @param sleepTime Halt time in milliseconds.
 **/
const watchQueue = async (redis, queue, sleepTime) => {
    await redis.lpop('queue:' + queue)
    .then((element) => {
        if (element) {
            const item = JSON.parse(element);
            commadsList[item.name](item.args);
        }
    })
    .catch((err) => console.error(err));

    return Promise.delay(sleepTime).then(async () => await watchQueue(redis, queue, sleepTime));
};

module.exports = { executeLater, pollQueue, watchQueue };
