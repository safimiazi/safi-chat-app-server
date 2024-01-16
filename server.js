const app = require("./app");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config({ path: "./config.env" });
const { Server } = require("socket.io");

process.on("uncaughtException", (err) => {
    console.log(err);
    process.exit(1);
});

const http = require("http");
const User = require("./models/user");
const FriendRequest = require("./models/friendRequest");
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:300",
        methods: ["GET", "POST"]
    }
});

const DB = process.env.DB_URI.replace("<PASSWORD>", process.env.DB_PASSWORD);
mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then((con) => {
        console.log("DB connection is successful");
    })
    .catch((err) => {
        console.log(err);
    });




const port = process.env.PORT || 8000;

const listen = server.listen(port, () => {
    console.log(`app running on port ${port}`);
});


io.on("connection", async (socket) => {
    // console.log(JSON.stringify(socket.handshake.query));
    // console.log("socket", socket);
    const user_id = socket.handshake.query("user_id");
    const socket_id = socket.id;

    console.log(`User connection ${socket_id}`);

    if (Boolean(user_id)) {
        await User.findByIdAndUpdate(user_id, { socket_id })
    }

    //we can write socket event listeners here.....
    socket.on("friend_request", async (data) => {
        console.log(data.to);
        //data => {to, from}
        const to_user = await User.findById(data.to).select("socket_id");
        const from_user = await User.findById(data.from).select("socket_id");

        await FriendRequest.create({
            sender: data.from,
            recipient: data.to,
        })

        //TODO => create a friend request
        //emit event => "new_friend_request"
        io.to(to_user.socket_id).emit("new_friend_request", {
            //
            message: "New Friend Request Received"
        });
        //emit event => "request_sent"
        io.to(from_user.socket_id).emit("request_send",{
            message: "Request send successfully"
        })
    })

    socket.on("accept_request", async (data)=> {
        console.log(data);
    
        const request_doc = await FriendRequest.findById(data.request_id);
        console.log(request_doc);
    
        //request_id
    
        const sender = await User.findById(request_doc.sender);
        const receiver = await User.findById(request_doc.recipient);
    
        sender.friends.push(request_doc.recipient);
        receiver.friends.push(request_doc.sender);
    
        await receiver.save({new: true, validateModifiedOnly: true});
        await sender.save({new: true, validateModifiedOnly: true});
    
        await FriendRequest.findByIdAndUpdate(data.request_id);
    
        io.to(sender.socket_id).emit("request_accepted", {
            message: "Friend Request Accepted",
        });
        io.to(receiver.socket_id).emit("request_accepted", {
            message: "Friend Request Accepted",
        });
    
    })
    
    socket.on("end", function () {
        console.log("Closing connection");
        socket.disconnect(0);
    })

})





process.on("unhandledRejection", (err) => {
    console.log(err);
    mongoose.disconnect();
});
