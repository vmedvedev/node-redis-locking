## About
Generally, when you “lock” data, you first acquire the lock, giving you exclusive access to the data. You then perform your operations. Finally, you release the lock to others.
This sequence of acquire, operate, release is pretty well known in the context of shared-memory data structures being accessed by threads.

#### Build docker image:
```bash
$ docker-compose build
```

#### Run server:
```bash
$ docker-compose up
```

#### Run example by http request:
```bash
$ curl http://localhost:8080?message=Hello+World
```

#### GitHub repo:
[vmedvedev/node-redis-locking](https://github.com/vmedvedev/node-redis-locking)
