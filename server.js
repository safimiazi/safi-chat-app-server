const app = require("./app");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config({ path: "./config.env" });
const {Server}= require("socket.io");

process.on("uncaughtException", (err) => {
    console.log(err);
    process.exit(1);
});

const http = require("http");
const User = require("./models/user");
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

io.on("connection", async(socket) => {
    // console.log("socket", socket);
    const user_id = socket.handshake.query("user_id");
    const socket_id = socket.id;

    console.log(`User connection ${socket_id}`);

    if(user_id){
        await User.findByIdAndUpdate(user_id, {socket_id})
    }

    //we can write socket event listeners here.....
    socket.on("friend_request", async (data)=> {
        console.log(data.to);

        const to = await User.findById(data.to);

        //TODO => create a friend request

        io.to(to.socket_id).emit("new_friend_request", {

        });
    })
})

process.on("unhandledRejection", (err) => {
    console.log(err);
    mongoose.disconnect();
});
