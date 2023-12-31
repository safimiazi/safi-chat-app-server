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
    }
})