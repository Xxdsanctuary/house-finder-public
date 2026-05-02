const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:      { type: String, required: true, unique: true },
    email:         { type: String, required: true },
    password:      { type: String, required: true },
    gender:        { type: String, required: true, enum: ['male', 'female', 'others'] },
    age:           { type: Number, required: true },
    bio:           { type: String },
    contactNumber: { type: String },   // optional
    role:          { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive:      { type: Boolean, default: true },

    // User room preferences (all optional, filled in on preferences page)
    preferences: {
        regions: [{ type: String, enum: ['North', 'South', 'East', 'West', 'Central'] }],
        maxBudget: { type: Number },
        amenities: {
            privateToilet:  { type: Boolean },
            aircon:         { type: Boolean },
            wifi:           { type: Boolean },
            fullyFurnished: { type: Boolean }
        }
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// takes in userid, returns user object associated with that id
exports.findUserById = async (userid) => {
    try {
        return await User.findById(userid);
    } catch (err) {
        console.error("cannot find user by id");
        throw err;
    }
}

// find the user object inside the database by username, takes in object that contains part of the attributes
exports.findUser = async(username) => {
    try {
        return await User.findOne({ username: username });
    } catch (err) {
        console.error("cannot find user by username");
        throw err;
    }
}

// creates account, takes in object of the new data to be inserted --> the id is automatically created
exports.createAccount = async (userDetails) => {
    try {
        return await User.create(userDetails);
    } catch (err) {
        console.error("cannot create user");
        throw err;
    }
}

// updates the user object associated with that id
exports.updateUserById = async (userid, editedChanges) => {
    try {
        return await User.findByIdAndUpdate(userid, editedChanges);
    } catch (err) {
        console.error("cannot update user");
        throw err;
    }
}

// delete user by its id
exports.deleteUserById = async (userid) => {
    try {
        return await User.findByIdAndDelete(userid);
    } catch (err) {
        console.error("cannot delete user, consider manual deletion");
        throw err;
    }
}

exports.UserModel = User;