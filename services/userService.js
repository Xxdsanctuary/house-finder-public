const User = require("../models/User");

// gets the username of a person by its id, takes in Id and returns the user object (for use outside accountController)
const getUserById = async (userid) => {
    return await User.findUserById(userid);
}

module.exports = { getUserById };