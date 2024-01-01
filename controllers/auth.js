const jwt = require('jsonwebtoken');
const User = require("../models/user")

exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({
            status: "error",
            message: "Both email and password are required"
        })
    }

const userDoc = await User.findOne({email: email}).select("+password");

if(!userDoc || !(await userDoc.correctPassword(password, userDoc.password))){
    res.status(400).json({
        status: "error",
        message: "Email or password is Incorrect"
    })
}


}