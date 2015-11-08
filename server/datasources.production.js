module.exports = {
  mongodb: {
    name: "mongodb",
    connector: "mongodb",
    url: process.env.MONGO_URI || "mongodb://localhost:27017/mobilize"
  }
};
