const jwt = require('jsonwebtoken');
const User = require("../models/user")

exports.login = async(req, res, next) => {
    const {email, password} = req.body;
}