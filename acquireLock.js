'use strict';

const { v4: uuidv4 } = require('uuid');

const acquireLock = async (redis, lockname) => {
  const identifier = uuidv4();
  const timeout = 10000; // 10 seconds
  const end = Date.now() + timeout;
  let isLocked = false;

  while (Date.now() < end) {
    await redis.setnx('lock:' + lockname, identifier)
    .then((result) => {
      isLocked = Boolean(Number(result));
    });

    if (isLocked) {
      return identifier;
    }

    await sleep(1000);
  }

  return false;
};

module.exports = { acquireLock };
