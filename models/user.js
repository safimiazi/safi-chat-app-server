const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        require: [true, "First Name is required"],
    },
    lastName: {
        type: String,
        require: [true, "Last Name is required"],
    },
    avatar: {
        type: String,
    },
    email: {
        type: String,
        require: [true, "Email is required"],
        validate: {
            validator: function (email) {
                return String(email).toLowerCase().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
            },
            message: (props) => `Email (${props.value}) is invalid`
        }

    },
    password: {
        type: String,
    },
    passwordConfirm: {
        type: String,
    },
    passwordChangedAt: {
        type: Date,
    },
    passwordResetToken: {
        type: String,
    },
    passwordResetExpire: {
        type: Date,
    },
    createAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: Number,
    },
    otp_expiry_time: {
        type: Date,
    }
});


userSchema.pre("save", async function(next) {
    //only run this function if OTP is actually modified

    if(!this.isModified("otp")) return next();

    //Hash the otp with the cost of 12
    this.otp = await bcryptjs.hash(this.otp, 12);
    next();
})

userSchema.pre("save", async function(next) {
    //only run this function if OTP is actually modified

    if(!this.isModified("password")) return next();

    //Hash the password with the cost of 12
    this.password = await bcryptjs.hash(this.password, 12);
    next();
})



userSchema.methods.correctPassword = async function(canditatePassword, userPassword){
    return await bcrypt.compare(canditatePassword, userPassword);
}

userSchema.methods.correctOTP = async function(canditateOTP, userOTP){
    return await bcrypt.compare(canditateOTP, userOTP);
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpire = Date.now() + 10*60*1000;
    return resetToken;
}

userSchema.methods.changedPasswordAfter = function (timestamp) {
    return timestamp > this.passwordChangedAt;
}




const User = new mongoose.model("User", userSchema);
module.exports= User;