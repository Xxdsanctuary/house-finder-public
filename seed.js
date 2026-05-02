const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './config/config.env' });

const User = require('./models/User');
const Room = require('./models/Room');
const Listing = require('./models/Listing');

async function seed() {
    await mongoose.connect(process.env.DB);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Room.deleteMany({});
    await Listing.deleteMany({});
    console.log('Cleared existing data');

    const hashedPw = await bcrypt.hash('password123', 10);

    // ========== USERS ==========
    const users = await User.insertMany([
        {
            username: 'alice_tan', email: 'alice@example.com', password: hashedPw,
            gender: 'female', age: 24, bio: 'Neat and tidy. Early sleeper.',
            contactNumber: '+65 9111 1111', role: 'user',
            preferences: { regions: ['Central', 'East'], maxBudget: 900, amenities: { aircon: true, wifi: true } }
        },
        {
            username: 'bob_lim', email: 'bob@example.com', password: hashedPw,
            gender: 'male', age: 27, bio: 'Chill guy, works from home. Love cooking.',
            contactNumber: '+65 9222 2222', role: 'user',
            preferences: { regions: ['West', 'Central'], maxBudget: 1200, amenities: { privateToilet: true, aircon: true, wifi: true, fullyFurnished: true } }
        },
        {
            username: 'charlie_ng', email: 'charlie@example.com', password: hashedPw,
            gender: 'male', age: 22, bio: 'NUS student looking for affordable accommodation near school.',
            contactNumber: '+65 9333 3333', role: 'user',
            preferences: { regions: ['West'], maxBudget: 700, amenities: { wifi: true } }
        },
        {
            username: 'diana_wong', email: 'diana@example.com', password: hashedPw,
            gender: 'female', age: 25, bio: 'Working professional. Quiet and respectful.',
            contactNumber: '+65 9444 4444', role: 'user',
            preferences: { regions: ['Central', 'South'], maxBudget: 1500, amenities: { privateToilet: true, aircon: true, wifi: true, fullyFurnished: true } }
        },
        {
            username: 'admin_user', email: 'admin@example.com', password: hashedPw,
            gender: 'male', age: 30, bio: 'Platform administrator.',
            role: 'admin',
            preferences: {}
        }
    ]);

    console.log(`Created ${users.length} users`);

    // ========== ROOMS (for listings that offer a room) ==========
    const rooms = await Room.insertMany([
        {
            title: 'Cozy Master Room at Bishan',
            description: 'Spacious master bedroom with attached bathroom. Near Bishan MRT, lots of amenities nearby.',
            monthlyRent: 850,
            region: 'Central', // will be overridden by pre-validate hook
            nearestMRT: 'Bishan',
            image: 'hall_1.jpeg',
            amenities: { privateToilet: true, aircon: true, wifi: true, fullyFurnished: true },
            creator: users[1]._id // bob
        },
        {
            title: 'Budget Room near Clementi',
            description: 'Simple common room in a 3-room HDB. Perfect for students on a budget. 5 min walk to Clementi MRT.',
            monthlyRent: 650,
            region: 'West',
            nearestMRT: 'Clementi',
            image: 'hall_3.png',
            amenities: { privateToilet: false, aircon: true, wifi: true, fullyFurnished: false },
            creator: users[2]._id // charlie
        },
        {
            title: 'Luxury Condo Room at Orchard',
            description: 'High-floor condo room with city view. Fully furnished with premium fittings. Pool and gym access.',
            monthlyRent: 1400,
            region: 'Central',
            nearestMRT: 'Orchard',
            image: 'hall_5.jpg',
            amenities: { privateToilet: true, aircon: true, wifi: true, fullyFurnished: true },
            creator: users[3]._id // diana
        },
        {
            title: 'Common Room in Tampines HDB',
            description: 'Clean and well-maintained common room. Near Tampines Mall and MRT. Friendly flatmates.',
            monthlyRent: 750,
            region: 'East',
            nearestMRT: 'Tampines',
            image: 'hall_7.jpeg',
            amenities: { privateToilet: false, aircon: true, wifi: true, fullyFurnished: true },
            creator: users[0]._id // alice
        }
    ]);

    console.log(`Created ${rooms.length} rooms`);

    // ========== LISTINGS ==========
    const listings = await Listing.insertMany([
        // --- Listings WITH rooms (offering a space) ---
        {
            title: 'Master Room at Bishan - Looking for female roommate',
            description: 'I have a spacious master room to share. Looking for a clean and quiet female roommate. No smoking please.',
            budget: 850, noOfSlots: 1, availableSlots: [],
            preferredGender: 'Female', status: 'available',
            room: rooms[0]._id, creator: users[1]._id // bob offering
        },
        {
            title: 'Affordable room near NUS - Any gender welcome',
            description: 'Student-friendly room near Clementi MRT. Shared bathroom. Great for NUS/NTU students commuting.',
            budget: 650, noOfSlots: 2, availableSlots: [],
            preferredGender: 'Any', status: 'available',
            room: rooms[1]._id, creator: users[2]._id // charlie offering
        },
        {
            title: 'Premium condo room at Orchard - Female only',
            description: 'Luxury living at its finest. Looking for a working professional female to share this beautiful space.',
            budget: 1400, noOfSlots: 1, availableSlots: [],
            preferredGender: 'Female', status: 'available',
            room: rooms[2]._id, creator: users[3]._id // diana offering
        },
        {
            title: 'Cozy room in Tampines - Males welcome',
            description: 'I have a room in my Tampines HDB flat. Looking for a tidy male roommate. Near MRT and great hawker food.',
            budget: 750, noOfSlots: 1, availableSlots: [users[1]._id],
            preferredGender: 'Male', status: 'fully booked',
            room: rooms[3]._id, creator: users[0]._id // alice offering (fully booked)
        },

        // --- Listings WITHOUT rooms (seeking a room) ---
        {
            title: 'Looking for a room near Central area',
            description: 'Hi! I am a 24F looking for a room in the Central area. Budget around $900. I am neat and quiet.',
            budget: 900, noOfSlots: 1, availableSlots: [],
            preferredGender: 'Female', status: 'available',
            room: null, creator: users[0]._id // alice seeking
        },
        {
            title: 'Male student seeking room near West',
            description: 'NUS Year 3 student. Looking for affordable accommodation near Clementi or Buona Vista. Budget is tight.',
            budget: 700, noOfSlots: 1, availableSlots: [],
            preferredGender: 'Male', status: 'available',
            room: null, creator: users[2]._id // charlie seeking
        },
        {
            title: 'Working professional seeking flatmate',
            description: 'Looking for a room anywhere accessible. I work long hours so I am rarely home. Very quiet tenant!',
            budget: 1100, noOfSlots: 1, availableSlots: [],
            preferredGender: 'Any', status: 'available',
            room: null, creator: users[1]._id // bob seeking
        }
    ]);

    console.log(`Created ${listings.length} listings`);

    console.log('\n--- Seed Complete! ---');
    console.log('Login credentials (all use password: password123):');
    console.log('  alice_tan   (female, user)');
    console.log('  bob_lim     (male, user)');
    console.log('  charlie_ng  (male, user)');
    console.log('  diana_wong  (female, user)');
    console.log('  admin_user  (male, admin)');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
