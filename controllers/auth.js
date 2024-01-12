const jwt = require('jsonwebtoken');

const User = require("../models/user");
const filterObj = require('../utils/filterObj');
const otpGenerator = require('otp-generator');
const { json } = require('body-parser');
const { promisify } = require('util');

const crypto = require("crypto");
const mailService = require("../services/mailer");
const resetPassword = require('../Templates/Mail/resetPassword');

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET);

//SignUp Process => register -> send OTP -> verify OTP

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

    };
};

exports.sendOTP = async (req, res, next) => {
    const { userId } = req;
    const new_otp = otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
    const otp_expiry_time = new Date(Date.now() + 10 * 60 * 1000); // Use Date object to calculate expiry time
    // 10 mins after otp is sent

    const user = await User.findByIdAndUpdate(userId, {
        otp: new_otp,
        otp_expiry_time,
    });
    console.log(user.email);
    user.otp = new_otp.toString();

    await user.save({ new: true, validateModifiedOnly: true });

    console.log(new_otp);

    // TODO send mail
    mailService.sendEmail({
        to: user.email,
        subject: "Verification OTP",
        text: `OTP for verification is ${new_otp}, This OTP is valid for next 10 mins`
    });

    res.status(200).json({
        status: "success",
        message: "OTP Sent Successfully",
    });
};


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
        });
        return;
    }
    

const isCorrectOTP = await user.correctOTP(otp, user.otp);
console.log(isCorrectOTP);
if (!isCorrectOTP) {
    return res.status(400).json({
        status: "error",
        message: "OTP is incorrect",
    });
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
        });
        return;
    }

    const token = signToken(userDoc._id);

    res.status(200).json({
        status: "success",
        message: "Logged in successfully",
        token,
    })


}




exports.protect = async (req, res, next) => {
    //1) getting token (jwt) and check if its there
    let token;
    //"bearer  ljflsjfsjflsdjs"

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    } else {
        req.status(400).json({
            status: "error",
            message: "You are not logged In! Please Log in to get access"
        });
        return;
    }

    //verification of token
    const decoded = await promisify(jwt.verify)(token, this.process.env.JWT_SECRET);

    //3) check if user still exist

    const this_user = await User.findById(decoded.userId);

    if (!this_user) {
        res.status(400).json({
            status: "error",
            message: "The user does not exist",
        });
    }

    //4) check if user changed their password ofter token was issued
    if (this_user.changedPasswordAfter(decoded.iai)) {
        res.status(400).json({
            status: "error",
            message: "User recently updated password! please log in again",
        });
    }

    req.user = this_user;
    next()

}


//types of routes => protected (only logged in users can access these) and unProtected


exports.forgotPassword = async (req, res, next) => {
    //get user email
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        res.status(400).json({
            status: "error",
            message: "There is no user with given email address"
        });
        return;
    }

    //Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    const resetURL = `http://localhost:3001/auth/new-password?token=${resetToken}`;

    try {
        //TODO => send email with reset url
mailService.sendEmail({
    to: user.email,
    subject: "Reset Password",
    html: resetPassword(user.firstName, resetURL),
    attachments: [],
  })
        
console.log(resetToken);

        res.status(200).json({
            status: "success",
            message: "Reset password link sent to Email"
        })
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpire = undefined;

        await user.save({ validateBeforeSave: false });

        res.status(500).json({
            status: "error",
            message: "There was an error sending the email, please try again later."
        })
    }


}

exports.resetPassword = async (req, res, next) => {
    //Get user based on token
    console.log("coming", req.body.token);
    const hashedToken = crypto.createHash("sha256").update(req.body.token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpire: { $gt: Date.now() },
    });

    

    //if token has expired or submission is out of time window

    if (!user) {
        res.status(400).json({
            status: "error",
            message: "Token is Invalid or Expired"
        });
        return;
    }

   
// const currentTime = new Date()

//   const timeDifference = currentTime - resetCreationTime

//   if (timeDifference > 24 * 60 * 60 * 1000) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'Reset link has expired')
//   }

    //update users password and set resetToken and expiry to undefined
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;

    await user.save();

    // login the user and send new JWT;

    //TODO => send an email to user informing about password reset;j

    const token = signToken(user._id);

    res.status(200).json({
        status: "success",
        message: "password Reseted successfully",
        token,
    })
}