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

    }
})