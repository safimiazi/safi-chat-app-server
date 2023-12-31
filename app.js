const express = require("express"); // web frameWork for node.js
const morgan = require("morgan")  //http request logger middleware for node.js
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize")
const bodyParser = require("body-parser");

const app = express()

app.use(express.json({limit: "10kb"}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(helmet())

if(process.env.NODE_ENV === "development"){
    app.use(morgan("dev"));
}

const limited = rateLimit({
    
})

module.exports = app;