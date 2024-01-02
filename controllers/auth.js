const jwt = require('jsonwebtoken');
const User = require("../models/user");
const filterObj = require('../utils/filterObj');
const otpGenerator = require('otp-generator');
const { json } = require('body-parser');

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

exports.sendOTP = async (req, res, next) => {
    const { userId } = req;
    const new_otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
    const otp_expiry_time = Date.new() + 10 * 60 * 1000; // 10 mins after otp is sent

    await User.findByIdAndUpdate(userId, {
        otp: new_otp,
        otp_expiry_time,
    });

    // TODO send mail

    res.status(200), json({
        status: "success",
        message: "OTP Send Successfully"
    })

}

exports.verifyOTP = async (req, res, next) => {
    //verify otp and update user record accordingly
    const { email, otp } = req.body;

    const user = await User.findOne({
        email,
        otp_expiry_time: { $gt: Date.now() },
    });

    if (!user) {
        res.status(400).json({
            status: "error",
            message: "Email is Invalid or OTP expired",
        })
    }

    if (!await user.correctOTP(otp, user.otp)) {
        res.status(400).json({
            status: "error",
            message: "OTP is incorrect",
        })
    }

    //OTP is correct

    user.verified = true;
    user.otp = undefined;
    await user.save({ new: true, validateModifiedOnly: true })

    const token = signToken(user._id);

    res.status(200).json({
        status: "success",
        message: "OTP verified successfully",
        token,
    })
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




exports.protect = async (req, res, next) => {
    //
}


exports.forgotPassword = async (req, res, next) => {
    //get user email
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        res.status(400).json({
            status: "error",
            message: "There is no user with given email address"
        })
    }

    //Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    const resetURL = `https://safichat.com/auth/reset-password/?code=${resetToken}`;

try {
    //TODO => send email with reset url

    res.status(200).json({
        status: "success",
        message: "Reset password link sent to Email"
    })
} catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;

    await user.save({validateBeforeSave: false});

    res.status(500).json({
        status: "error",
        message: "There was an error sending the email, please try again later."
    })
}

    
}

exports.resetPassword = async (req, res, next) => {
    //Get user based on token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest()
    
}