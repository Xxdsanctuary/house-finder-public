const bcrypt = require("bcrypt");
const User = require("../models/User");

// Renders the register page
exports.registerGet = (req, res) => {
    res.render("auth/register", { error: null, success: false, formData: null });
};

// Sends the registered information and validate to register
exports.registerPost = async (req, res, next) => {
    try {
        const { username, email, gender, age, contactNumber, password } = req.body;

        const formData = { username, email, gender, age, contactNumber };

        if (password.length < 6) {
            return res.render("auth/register", { error: "Password must be at least 6 characters.", success: false, formData });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const existingUser = await User.findUser(username);

        if (existingUser) {
            return res.render("auth/register", { error: "Username already exists. Please choose another one.", success: false, formData });
        }

        const user = await User.createAccount({
            username,
            email,
            gender,
            age,
            contactNumber: contactNumber || undefined,
            password: hashedPassword
        });

        req.session.user = { _id: user._id, username: user.username, role: user.role };

        res.redirect('/profile/preferences?from=register');

    } catch (err) {
        return next(err);
    }
};

// Renders the login page
exports.loginGet = (req, res) => {
    res.render("auth/login", { error: null });
};

// Sends the login information and validate with the database
exports.loginPost = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const user = await User.findUser(username);

        // User not found
        if (!user) {
            return res.render("auth/login", { error: "Invalid username or password" });
        }

        // Compare entered password against stored hashed password
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            if (user.isActive === false) {
                return res.render("auth/login", { error: "This account has been deactivated." });
            }
            req.session.user = {
                _id: user._id,
                username: user.username,
                role: user.role
            };
            return res.redirect("/dashboard");
        } else {
            return res.render("auth/login", { error: "Invalid username or password" });
        }

    } catch (err) {
        return next(err);
    }
};

// Initiating logout by destroying the session/cookie
exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
};
