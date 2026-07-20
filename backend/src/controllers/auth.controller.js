import {ENV} from '../lib/env.js';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/utils.js';
import {sendWelcomeEmail, sendOTPEmail} from '../emails/emailHandlers.js';
import cloudinary from '../lib/cloudinary.js';

const isGmailAddress = (email) => /@gmail\.com$/i.test(String(email || "").trim());
const OTP_EXPIRY_MS = 60 * 1000;

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const sendWelcomeEmailIfFirstLogin = async (user) => {
    if (user.isWelcomeEmailSent) return;

    try {
        await sendWelcomeEmail(user.email, user.fullName, ENV.CLIENT_URL);
        await User.updateOne(
            { _id: user._id },
            { $set: { isWelcomeEmailSent: true, welcomeEmailSentAt: new Date() } }
        );
    } catch (error) {
        console.error("Failed to send first-login welcome email:", error);
    }
};

export const signup = async (req,res)=>{
    const {fullName, email, password, phoneNumber} = req.body;
    try {
        if(!fullName || !email || !password){
            return res.status(400).json({message: "All fields are required"});
        }
        if(password.length < 6){
            return res.status(400).json({message: "Password must be at least 6 characters long"});
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({message: "Invalid email format"});
        }
        const user = await User.findOne({email});
        if(user){
            return res.status(400).json({message: "Email already exists"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            fullName,
            email,
            phoneNumber: phoneNumber || "",
            password: hashedPassword
        });
        if(newUser){
            const savedUser = await newUser.save();
            return res.status(201).json({
                success: true,
                message: "Account created successfully. Please log in.",
                _id: savedUser._id,
                fullName: savedUser.fullName,
                ehoneNumber: savedUser.phoneNumber,
                pmail: savedUser.email,
                profilePic: savedUser.profilePic,
                createdAt: savedUser.createdAt,
            });

        }
        else{
            return res.status(400).json({message: "Invalid user data"});
        }
    } 
    catch (error) {
        console.log("Error in signup controller:", error);
        res.status(500).json({message: "Internal server error"});
    }
};

export const login = async (req,res) => {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if(!normalizedEmail || !password)
    {
        return res.status(400).json({message: "Email and password are required"});
    }

    if(!isGmailAddress(normalizedEmail)) {
        return res.status(400).json({message: "OTP login supports Gmail addresses only (@gmail.com)."});
    }

    try {
        const user = await User.findOne({email: normalizedEmail});
        if(!user) return res.status(400).json({message:"Invalid credentials"});

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect) return res.status(400).json({message:"Invalid credentials"});

        const otpFilter = { email: normalizedEmail };

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Delete any existing OTP for this identifier
        await OTP.deleteMany(otpFilter);
        
        // Save OTP to database (expires in 1 minute)
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
        await OTP.create({
            ...otpFilter,
            otp,
            expiresAt
        });
        
        // Send OTP via selected channel
        try {
            await sendOTPEmail(normalizedEmail, otp);
        } catch (error) {
            console.error("Failed to send OTP:", error);
            return res.status(500).json({message: error?.message || "Failed to send OTP. Please try again."});
        }
        
        res.status(200).json({
            success: true,
            message: "OTP sent to your email",
            email: normalizedEmail,
            deliveryChannel: "email",
            otpExpiresAt: expiresAt.toISOString(),
            otpExpiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000)
        });
    } 
    catch (error) {
        console.log("Error in login controller:", error);
        res.status(500).json({message: error?.message || "Internal server error"});
    }
};

export const verifyOTP = async (req,res) => {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if(!normalizedEmail || !otp) {
        return res.status(400).json({message: "Email and OTP are required"});
    }

    try {
        const otpFilter = { email: normalizedEmail };

        // Find OTP record
        const otpRecord = await OTP.findOne({ ...otpFilter, otp });
        
        if(!otpRecord) {
            return res.status(400).json({message: "Invalid OTP"});
        }

        // Check if OTP has expired
        if(otpRecord.expiresAt < new Date()) {
            await OTP.deleteOne({_id: otpRecord._id});
            return res.status(400).json({message: "OTP has expired. Please request a new one."});
        }

        // Find user and generate token
        const user = await User.findOne({ email: normalizedEmail });
        if(!user) {
            return res.status(400).json({message: "User not found"});
        }

        // Delete all OTP records after successful verification
        await OTP.deleteMany(otpFilter);

        await sendWelcomeEmailIfFirstLogin(user);

        // Generate JWT token
        generateToken(user._id, res);
        
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            createdAt: user.createdAt,
        });
    } 
    catch (error) {
        console.log("Error in verifyOTP controller:", error);
        res.status(500).json({message: "Internal server error"});
    }
};

export const resendOTP = async (req,res) => {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if(!normalizedEmail) {
        return res.status(400).json({message: "Email is required"});
    }

    if(!isGmailAddress(normalizedEmail)) {
        return res.status(400).json({message: "OTP resend supports Gmail addresses only (@gmail.com)."});
    }

    try {
        const otpFilter = { email: normalizedEmail };

        // Check if user exists
        const user = await User.findOne({ email: normalizedEmail });
        if(!user) {
            return res.status(400).json({message: "User not found"});
        }

        // Generate new 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Delete any existing OTP for this identifier
        await OTP.deleteMany(otpFilter);
        
        // Save OTP to database (expires in 1 minute)
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
        await OTP.create({
            ...otpFilter,
            otp,
            expiresAt
        });
        
        // Send OTP via selected channel
        try {
            await sendOTPEmail(normalizedEmail, otp);
        } catch (error) {
            console.error("Failed to resend OTP:", error);
            return res.status(500).json({message: error?.message || "Failed to send OTP. Please try again."});
        }
        
        res.status(200).json({
            success: true,
            message: "OTP resent to your email",
            email: normalizedEmail,
            deliveryChannel: "email",
            otpExpiresAt: expiresAt.toISOString(),
            otpExpiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000)
        });
    } 
    catch (error) {
        console.log("Error in resendOTP controller:", error);
        res.status(500).json({message: "Internal server error"});
    }
};

export const logout = (_,res) => {
    res.cookie("jwt","",{
        maxAge: 0,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production" ? true : false,
    });
    res.status(200).json({message: "Logged out successfully"});
};

export const updateProfile = async (req,res) => {
    try {
        const {profilePic} = req.body;
        if(!profilePic) return res.status(400).json({message: "Profile picture is required"});

        const userId = req.user._id;
        const uploadResponse = await cloudinary.uploader.upload(profilePic);

        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic: uploadResponse.secure_url}, {new: true});
        res.status(200).json(updatedUser);
    } 
    catch (error) {
        console.log("Error in updateProfile controller:", error);
        res.status(500).json({message: "Internal server error"});
    }
};
