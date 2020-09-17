'use strict';

const releaseLock = async (redis, lockname, identifier) => {
  try {
    const pipeline = redis.pipeline();
    const key = 'lock:' + lockname;

    await pipeline.watch(key).get(key).exec()
    .then(async (result) => {
      if(result.length > 1 && result[1][1] == identifier) {
        await pipeline.multi().del(key).exec();
      }
    });

    pipeline.unwatch().exec();

  } catch(err) {
    console.error(err);
  }
};

module.exports = { releaseLock };
