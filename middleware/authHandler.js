// takes in the user object from req.session
// tells whether the session is logged in (true) or not (false)
exports.isLoggedInRedirect = (req, res, next) => {
    if (!req.session.user) {
        console.log("User not logged in, redirect to login page");
        return res.redirect("/auth/login");
    }
    next();
};

exports.isAdminRedirect = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    if (req.session.user.role !== 'admin') {
        return res.status(403).send('Access denied: admin only');
    }
    next();
};