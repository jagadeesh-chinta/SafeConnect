import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        default: "",
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    profilePic: {
        type: String,
        default: "",
    },
    favourites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    chatKeyPassword: {
        type: String,
        select: false,
    },
    isChatKeyPasswordSet: {
        type: Boolean,
        default: false,
    },
    isWelcomeEmailSent: {
        type: Boolean,
        default: false,
    },
    welcomeEmailSentAt: {
        type: Date,
        default: null,
    },
},
{ timestamps: true }); //createdAt and updatedAt

const User = mongoose.model('User', userSchema);
export default User;