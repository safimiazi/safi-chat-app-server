const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.ObjectId,
        ref: "Use",
    },
    recipient: {
        type: mongoose.Schema.ObjectId,
        ref: "Use",
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    }
});

const FriendRequest = new mongoose.model("FriendRequest", requestSchema);
module.exports = FriendRequest;