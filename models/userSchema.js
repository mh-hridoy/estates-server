const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')
const validator = require('validator')

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        minLength: [4, "Name must contain more that 3 character"],
        maxLength: [40, "Name should not exceed 40 characters"]
    },
    email: {
        type: String,
        unique: [true, "User already exists, Please login instead"],
        required: [true, "Email is required"],
        trim : true,
        lowerCase: true,
        validate: [validator.isEmail, "Please provide a valid email address"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minLength: [8, "Password must contain at least 8 characters"],
    },
    role: {
        type: [String],
        default: "DTC",
        enum: ["DTC", "DCA", "Image", "NOS", "Client", "Third DCA", "Accountant"]
    },
    profilePicture: {
        type: {
            type: String,
            default : "/avatar.png"            
         }
    },

    likedPropertys: {
        type: [String],
    },

    status: {
        type: String,
        default: "Active",
        enum: ["Active", "inActive"]
    },
    setAlarmed: [String],

    selectedRole: String,

    usedResetToken : String,

}, { timestamps: true })


userSchema.pre("save", async function (next) {
    this.password = await bcrypt.hash(this.password, 12)
    next()
})

userSchema.pre(/^find/, async function (next) {
    this.select('-__v -createdAt -updatedAt')
    next()
})


userSchema.methods.comparePassword = async function (plainText, bcryptPassword) {
    return await bcrypt.compare(plainText, bcryptPassword)
    
}

module.exports = mongoose.model('User', userSchema)
