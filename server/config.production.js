var mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mobilize';
module.exports = {
  mongodb: {
    defaultForType: "mongodb",
    connector: "loopback-connector-mongodb",
    url: mongoUri
  }
};
