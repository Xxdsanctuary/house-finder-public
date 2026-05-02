const User = require("../models/User");

// tells whether the user is admin or not, returns true or false, takes in request object
exports.isAdmin = (req) => {
    if (req.session.user && req.session.user.role === "admin") {
        return true;
    } else {
        return false;
    }
}

// tells whether the user is logged in or not, no redirection, takes in request object
exports.isLoggedIn = (req) => {
    if (!req.session.user) {
        return false;
    } else {
        return true;
    }
}