const serverlessExpress = require("@codegenie/serverless-express");
const app = require("../src/app");
const connectDb = require("../src/config/db");

let dbReady = false;
const expressHandler = serverlessExpress({ app });

module.exports = async function (context, req) {
  if (!dbReady) {
    await connectDb();
    dbReady = true;
  }
  return expressHandler(context, req);
};
