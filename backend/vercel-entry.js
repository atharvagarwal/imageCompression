const express = require("express");
const app = require("./index"); // Import the Express app from api.js

const server = express();

server.all("*", (req, res) => {
  return app(req, res);
});

module.exports = server;