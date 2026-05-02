const mongoose = require('mongoose');

const mrtToRegionMap = {
    'Admiralty': 'North', 'Canberra': 'North', 'Kranji': 'North', 'Marsiling': 'North',
    'Sembawang': 'North', 'Woodlands': 'North', 'Woodlands North': 'North',
    'Woodlands South': 'North', 'Yishun': 'North', 'Khatib': 'North', 'Springleaf': 'North', 'Lentor': 'North', 'Mayflower': 'North', 'Bright Hill': 'North', 'Upper Thomson': 'North',
    'Buangkok': 'North', 'Hougang': 'North', 'Kovan': 'North', 'Punggol': 'North', 'Punggol Coast': 'North', 'Sengkang': 'North',

    'Aljunied': 'East', 'Bedok': 'East', 'Bedok North': 'East', 'Bedok Reservoir': 'East',
    'Bayshore': 'East', 'Changi Airport': 'East', 'Dakota': 'East', 'Eunos': 'East',
    'Expo': 'East', 'Kaki Bukit': 'East', 'Kembangan': 'East', 'MacPherson': 'East',
    'Marine Parade': 'East', 'Marine Terrace': 'East', 'Mountbatten': 'East',
    'Pasir Ris': 'East', 'Paya Lebar': 'East', 'Siglap': 'East', 'Simei': 'East',
    'Tampines': 'East', 'Tampines East': 'East', 'Tampines West': 'East',
    'Tanah Merah': 'East', 'Tanjong Katong': 'East', 'Ubi': 'East', 'Upper Changi': 'East', 'Tanjong Rhu': 'East', 'Katong Park': 'East',

    'Boon Lay': 'West', 'Bukit Batok': 'West', 'Bukit Gombak': 'West', 'Bukit Panjang': 'West',
    'Choa Chu Kang': 'West', 'Clementi': 'West', 'Chinese Garden': 'West', 'Commonwealth': 'West',
    'Dover': 'West', 'Haw Par Villa': 'West', 'Hillview': 'West', 'Hume': 'West',
    'Jurong East': 'West', 'Kent Ridge': 'West', 'Lakeside': 'West', 'one-north': 'West',
    'Pasir Panjang': 'West', 'Pioneer': 'West', 'Queenstown': 'West', 'Tuas Crescent': 'West',
    'Tuas Link': 'West', 'Tuas West Road': 'West', 'Yew Tee': 'West',

    'HarbourFront': 'South', 'Labrador Park': 'South', 'Marina South Pier': 'South', 'Telok Blangah': 'South',

    'Ang Mo Kio': 'Central', 'Bayfront': 'Central', 'Beauty World': 'Central', 'Bencoolen': 'Central',
    'Bendemeer': 'Central', 'Bishan': 'Central', 'Boon Keng': 'Central', 'Botanic Gardens': 'Central',
    'Braddell': 'Central', 'Bras Basah': 'Central', 'Bugis': 'Central', 'Buona Vista': 'Central',
    'Caldecott': 'Central', 'Cashew': 'Central', 'Chinatown': 'Central', 'City Hall': 'Central',
    'Clarke Quay': 'Central', 'Dhoby Ghaut': 'Central', 'Downtown': 'Central', 'Esplanade': 'Central',
    'Farrer Park': 'Central', 'Farrer Road': 'Central', 'Fort Canning': 'Central', 'Gardens by the Bay': 'Central',
    'Geylang Bahru': 'Central', 'Great World': 'Central', 'Havelock': 'Central', 'Holland Village': 'Central',
    'Jalan Besar': 'Central', 'Kallang': 'Central', 'Lavender': 'Central', 'Little India': 'Central',
    'Lorong Chuan': 'Central', 'Marina Bay': 'Central', 'Mattar': 'Central', 'Maxwell': 'Central',
    'Marymount': 'Central', 'Napier': 'Central', 'Newton': 'Central', 'Nicoll Highway': 'Central',
    'Novena': 'Central', 'Orchard': 'Central', 'Orchard Boulevard': 'Central', 'Outram Park': 'Central',
    'Potong Pasir': 'Central', 'Promenade': 'Central', 'Raffles Place': 'Central', 'Redhill': 'Central',
    'Rochor': 'Central', 'Serangoon': 'Central', 'Shenton Way': 'Central', 'Sixth Avenue': 'Central',
    'Somerset': 'Central', 'Stadium': 'Central', 'Stevens': 'Central', 'Tai Seng': 'Central',
    'Tan Kah Kee': 'Central', 'Tanjong Pagar': 'Central', 'Telok Ayer': 'Central', 'Toa Payoh': 'Central',
    'Woodleigh': 'Central', 'Yio Chu Kang': 'Central'
};

const roomSchema = new mongoose.Schema({
    // 1. Basic Information
    title: {
        type: String,
        required: [true, 'A room listing must have a title'],
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: [true, 'Please provide a description of the room and environment']
    },

    // 2. Financial & Logistics
    monthlyRent: {
        type: Number,
        required: [true, 'Please specify the monthly rent'],
        min: [0, 'Rent cannot be negative']
    },
    region: {
        type: String,
        required: true,
        enum: ['North', 'South', 'East', 'West', 'Central'],
    },
    availabilityStatus: {
        type: String,
        enum: ['Available', 'Taken', 'Draft'],
        default: 'Available'
    },

    // 3. New Refactored Attributes
    nearestMRT: {
        type: String,
        required: true,
        enum: [
            'Admiralty', 'Aljunied', 'Ang Mo Kio', 'Bayfront', 'Bayshore', 'Beauty World', 'Bedok', 'Bedok North', 'Bedok Reservoir', 'Bencoolen', 'Bendemeer', 'Bishan', 'Boon Keng', 'Boon Lay', 'Botanic Gardens', 'Braddell', 'Bras Basah', 'Bright Hill', 'Bugis', 'Buangkok', 'Buona Vista', 'Bukit Batok', 'Bukit Gombak', 'Bukit Panjang', 'Caldecott', 'Canberra', 'Cashew', 'Changi Airport', 'Chinatown', 'Chinese Garden', 'Choa Chu Kang', 'City Hall', 'Clarke Quay', 'Clementi', 'Commonwealth', 'Dakota', 'Dhoby Ghaut', 'Dover', 'Downtown', 'Esplanade', 'Eunos', 'Expo', 'Farrer Park', 'Farrer Road', 'Fort Canning', 'Gardens by the Bay', 'Geylang Bahru', 'Great World', 'HarbourFront', 'Havelock', 'Haw Par Villa', 'Hillview', 'Holland Village', 'Hougang', 'Hume', 'Jalan Besar', 'Jurong East', 'Kaki Bukit', 'Kallang', 'Katong Park', 'Kembangan', 'Kent Ridge', 'Khatib', 'Kovan', 'Kranji', 'Labrador Park', 'Lakeside', 'Lavender', 'Lentor', 'Little India', 'Lorong Chuan', 'MacPherson', 'Marina Bay', 'Marina South Pier', 'Marine Parade', 'Marine Terrace', 'Marsiling', 'Mattar', 'Maxwell', 'Mayflower', 'Marymount', 'Mountbatten', 'Napier', 'Newton', 'Nicoll Highway', 'Novena', 'one-north', 'Orchard', 'Orchard Boulevard', 'Outram Park', 'Pasir Panjang', 'Pasir Ris', 'Paya Lebar', 'Pioneer', 'Potong Pasir', 'Promenade', 'Punggol', 'Punggol Coast', 'Queenstown', 'Raffles Place', 'Redhill', 'Rochor', 'Sengkang', 'Serangoon', 'Sembawang', 'Shenton Way', 'Siglap', 'Simei', 'Sixth Avenue', 'Somerset', 'Springleaf', 'Stadium', 'Stevens', 'Tampines', 'Tampines East', 'Tampines West', 'Tan Kah Kee', 'Tanah Merah', 'Tanjong Katong', 'Tanjong Pagar', 'Tanjong Rhu', 'Tai Seng', 'Telok Ayer', 'Telok Blangah', 'Toa Payoh', 'Tuas Crescent', 'Tuas Link', 'Tuas West Road', 'Ubi', 'Upper Changi', 'Upper Thomson', 'Woodlands', 'Woodlands North', 'Woodlands South', 'Woodleigh', 'Yew Tee', 'Yio Chu Kang', 'Yishun'
        ]
    },
    image: {
        type: String,
        required: true,
        enum: ['hall_1.jpeg', 'hall_2.jpg', 'hall_3.png', 'hall_5.jpg', 'hall_6.webp', 'hall_7.jpeg', 'hall_8.webp']
    },
    amenities: {
        privateToilet: { type: Boolean, default: false },
        aircon: { type: Boolean, default: false },
        wifi: { type: Boolean, default: false },
        fullyFurnished: { type: Boolean, default: false }
    },

    // 4. Relationships (1-to-1 linkage to User)
    creator: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }

}, { timestamps: true });

roomSchema.pre('validate', function () {
    if (this.nearestMRT && mrtToRegionMap[this.nearestMRT]) {
        this.region = mrtToRegionMap[this.nearestMRT];
    }
});

module.exports = mongoose.model('Room', roomSchema);
