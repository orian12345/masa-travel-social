// Demo-only helper: spins up a real local MongoDB (via mongodb-memory-server)
// so the site can be previewed without waiting on MongoDB Atlas. Prints the
// connection string, then stays alive holding the database open. Not part
// of the actual app or the course submission — see README.
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri('masa');
  console.log('MEMORY_MONGO_URI=' + uri);
  console.log('Demo database running. Leave this process alive while using the demo.');

  process.on('SIGINT', async () => {
    await mongod.stop();
    process.exit(0);
  });
})();
