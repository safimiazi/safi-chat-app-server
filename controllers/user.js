const FriendRequest = require("../models/friendRequest");
const User = require("../models/user");
const filterObj = require("../utils/filterObj");
const { ObjectId } = require('mongoose').Types; // Import ObjectId from mongoose

exports.updateMe = async (req, res, next) => {
    const {user} = req;

    const filteredBody = filterObj(req.body, "firstName", "LastName", "about", "avatar");

    const updated_user = await User.findByIdAndUpdate(user._id, filteredBody, {
        new:true, validateModifiedOnly: true
    })

    res.status(200).json({
        status: "success", 
        data: updated_user,
        message: "Profile Updated successfully",
    });
}


// exports.getUsers = (async (req, res, next) => {
//     const all_users = await User.find({
//       verified: true,
//     }).select("firstName lastName _id");
  
//     const this_user = req.user;
  
//     console.log("all, this", this_user, );
//     const remaining_users = all_users.filter(
//       (user) =>
//         !this_user.friends.includes(user._id) && user._id !== this_user
//     );
  
//     res.status(200).json({
//       status: "success",
//       data: remaining_users,
//       message: "Users found successfully!",
//     });
//   });
  



exports.getUsers = async (req, res, next) => {
    try {
        const this_user = req.user;

        // Find friends and current user's ID
        const excludedUserIds = [...this_user.friends.map(String), this_user._id.toString()];

        // Fetch users who are verified and not in the excludedUserIds list
        const remaining_users = await User.find({
            verified: true,
            _id: { $nin: excludedUserIds },
        }).select("firstName lastName _id");

        console.log("remaining user", remaining_users);

        res.status(200).json({
            status: "success",
            data: remaining_users,
            message: "Users found successfully",
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
};




exports.getRequests = async (req, res, next) => {
    try {
        const userFriends = await User.findById(req.user._id).select('friends');

        const requests = await FriendRequest.find({
            recipient: new ObjectId(req.user._id),
            sender: { $nin: userFriends.friends },
        }).populate("sender", "_id firstName lastName");

        console.log("requests", requests);

        res.status(200).json({
            status: "success",
            data: requests,
            message: "Friend Requests Found Successfully",
        });
    } catch (error) {
        console.error("Error fetching friend requests:", error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
};



// exports.getRequests = async (req, res, next) => {
//     const requests = await FriendRequest.find({
//         recipient: new ObjectId(req.user._id),
//     }).populate("sender", "_id firstName lastName");
// console.log("requests",requests);
//     res.status(200).json({
//         status: "success",
//         data: requests,
//         message: "Friends requests Found Successfully"
//     })
// }


// exports.getFriends = async (req, res, next) => {

//     const existing_friends = await User.findById(req.user._id).select("friends")
//     console.log("existing", existing_friends);
//     const this_user = await User.findById(req.user._id).populate(
//       "friends",
//       "_id firstName lastName"
//     );
//     console.log("hhhhh", this_user);
//     res.status(200).json({
//       status: "success",
//       data: this_user.friends,
//       message: "Friends found successfully!",
//     });
//   };


exports.getFriends = async (req, res, next) => {
    try {
        const existing_friends = await User.findById(req.user._id).select("friends");
        console.log("existing", existing_friends);

        const this_user = await User.findById(req.user._id).populate(
            "friends",
            "firstName lastName _id"
        );

        // Use a Set to store unique friends based on their IDs
        const uniqueFriends = new Map();

        // Add existing friends to the Map
        existing_friends.friends.forEach((friend) => uniqueFriends.set(friend.toString(), friend));

        // Add friends from the populated user to the Map
        this_user.friends.forEach((friend) => uniqueFriends.set(friend._id.toString(), friend));

        // Convert the Map values back to an array
        const uniqueFriendsArray = Array.from(uniqueFriends.values());

        res.status(200).json({
            status: "success",
            data: uniqueFriendsArray,
            message: "Friends found successfully!",
        });
    } catch (error) {
        console.error("Error fetching friends:", error);
        res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
};
