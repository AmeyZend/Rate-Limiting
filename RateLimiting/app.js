const express = require('express');
const bodyParser = require('body-parser');
const cluster = require('cluster');
const os = require('os');
const Bull = require('bull');
const winston = require('winston');
const redis = require('redis');

const PORT = 3000;
const MAX_TASKS_PER_MIN = 20;
const MAX_TASKS_PER_SEC = 1;

const logger = winston.createLogger({
  transports: [new winston.transports.File({ filename: 'task_logs.log' })],
});

const redisClient = redis.createClient({ host: '127.0.0.1', port: 6379 });

const taskQueue = new Bull('taskQueue', { redis: { host: '127.0.0.1', port: 6379 } });

const rateLimiters = {};

async function task(user_id) {
  const timestamp = new Date().toISOString();
  const logEntry = `${user_id}-task completed at-${timestamp}`;
  console.log(logEntry);
  logger.info(logEntry);
}

taskQueue.process(async (job) => {
  const { user_id } = job.data;
  await task(user_id);
});

function canProcessTask(user_id) {
  const now = Date.now();

  if (!rateLimiters[user_id]) {
    rateLimiters[user_id] = { countSec: 0, countMin: 0, lastReset: now };
  }

  const limiter = rateLimiters[user_id];

  if (now - limiter.lastReset > 1000) {
    limiter.countSec = 0;
    limiter.lastReset = now;
  }
  if (now - limiter.lastReset > 60000) {
    limiter.countMin = 0;
    limiter.lastReset = now;
  }

  if (limiter.countSec < MAX_TASKS_PER_SEC && limiter.countMin < MAX_TASKS_PER_MIN) {
    limiter.countSec++;
    limiter.countMin++;
    return true;
  }

  return false;
}

if (cluster.isMaster) {
  const numWorkers = os.cpus().length;
  console.log(`Master ${process.pid} is running with ${numWorkers} workers`);

  for (let i = 0; i < 2; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died, spinning up a new one.`);
    cluster.fork();
  });
} else {
  const app = express();
  app.use(bodyParser.json());

  app.post('/api/v1/task', async (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).send({ error: 'user_id is required' });
    }

    if (canProcessTask(user_id)) {
      taskQueue.add({ user_id });
      res.status(200).send({ status: 'Task queued successfully' });
    } else {
      res.status(429).send({ error: 'Rate limit exceeded. Task will be queued.' });
    }
  });

  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });
}
