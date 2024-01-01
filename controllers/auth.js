const jwt = require('jsonwebtoken');
const User = require("../models/user");
const filterObj = require('../utils/filterObj');

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);


//register new user:
exports.register = async (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;


    const filteredBody = filterObj(req.body, "firstName", "lastName", "password", "email");
    //check if a verified user with given email exists
    const existing_user = await User.findOne({ email: email });

    if (existing_user && existing_user.verified) {
        res.status(400).json({
            status: "error",
            message: "Email is already in use, Please login"
        })
    } else if (existing_user) {
        await User.findOneAndUpdate({ email: email }, filteredBody, { new: true, validateModifiedOnly: true })
        //generate OTP and send email to user
        req.userId = existing_user._id;
        next();
    } else {
        //if user record is not available in DB
        const new_user = await User.create(filteredBody)

        //generate OTP and send email to user
        req.userId = new_user._id
        next();

    }
}


exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({
            status: "error",
            message: "Both email and password are required"
        })
    }

    const userDoc = await User.findOne({ email: email }).select("+password");

    if (!userDoc || !(await userDoc.correctPassword(password, userDoc.password))) {
        res.status(400).json({
            status: "error",
            message: "Email or password is Incorrect"
        })
    }

    const token = signToken(userDoc._id);

    res.status(200).json({
        status: "success",
        message: "Logged in successfully",
        token,
    })


}