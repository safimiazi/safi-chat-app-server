const express = require("express"); // web frameWork for node.js
const morgan = require("morgan")  //http request logger middleware for node.js

const rateLimit = require("express-rate-limit");
const helmet = require("helmet")


const app = express()

module.exports = app;