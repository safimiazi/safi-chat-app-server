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

userSchema.methods.correctPassword = async function(canditatePassword, userPassword){
    return await bcrypt.compare(canditatePassword, userPassword);
}

const User = new mongoose.model("User", userSchema);
module.exports= User;