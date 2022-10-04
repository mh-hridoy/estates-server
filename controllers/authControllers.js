const User = require('../models/userSchema')
const asynchErrorHandler = require('../utils/asynchErrorHandler')
const jwt = require('jsonwebtoken')
const sgMail = require('@sendgrid/mail')
const { nanoid } = require('nanoid')
const Code = require('../models/resetSchema')
const ErrorHandler = require('../utils/ErrorHandler')

const signup = asynchErrorHandler(async (req, res) => {  //asynchErrorHandler function will use  the req, res and next arguments as props that been declared in the anonymous and callback function. 
    const { name, email, password } = req.body;
    const user = await new User({ name, email, password })
    await user.save()
    res.json({ message: 'Signup successful, Please log in now.' })
})

const login = asynchErrorHandler(async (req, res, next) => {

    const { email, password } = req.body
    const privateKey = process.env.JWT_SECRET

    const user = await User.findOne({ email }).exec()
    // const comparePassword = await bcrypt.compare(password, user.password)

    if (!user || !password) {
        return next(new ErrorHandler('Credentials does not exist', 404))
    }

    if (user.status !== "Active") {
        return next(new ErrorHandler('Your account is not active. Please contact our administrator.', 404))
    }

    if (user && await user.comparePassword(password, user.password)) {
        var token = jwt.sign({ id: user._id }, privateKey, { expiresIn: "10d" });

        res.cookie("token", token, {
            httpOnly: true,
        })
        res.setHeader('Authorization', 'Bearer ' + token);

        user.buyItNotifications = undefined
                user.password = undefined

        res.status(200).json({ user, token })

    } else {
        return next(new ErrorHandler('Credentials does not exist', 404))
    }
})

const sendResetCode = asynchErrorHandler(async (req, res, next) => {
    const { email } = req.body
    const resetCode = nanoid(6).toUpperCase()

    const user = await User.findOne({ email })

    if (!user) { return next(new ErrorHandler("Credentials does not exist.", 404)) } else {

        sgMail.setApiKey(process.env.SENDGRID_SECRET_KEY)
        const msg = {
            to: email, // Change to your recipient
            from: 'alif.pab120na.12@gmail.com', // Change to your verified sender
            subject: 'Password reset code',
            text: 'Do not share your password reset code with anyone.',
            html: `<h1> Do not share your password reset code with anyone.</h1>
            <br>
            <center> <strong>${resetCode}</strong> </center/>
            `,
        }
        sgMail
            .send(msg)
            .then(() => {
                console.log('Email sent')
            })
            .catch((error) => {
                console.error(error)
            })

        const existingCode = await Code.findOne({ email }).select('-__v -createdAt -updatedAt')
        if (existingCode) {
            await Code.deleteOne({ email })
            const saveCode = await new Code({ resetCode, email })
            await saveCode.save()
        } else {
            const saveCode = await new Code({ resetCode, email })
            await saveCode.save()
        }
        res.json('Email sent!')
    }
})

const verifyCode = asynchErrorHandler(async (req, res, next) => {

    const { email, resetCode } = req.body

    const code = await Code.findOne({ email })


    if (typeof code === 'undefined' && code.length === 0) { return next(new ErrorHandler("Invalid or expired reset code, Please try again.", 400)) } else if (await code.comparetoken(resetCode, code.resetCode)) {
        const verifiedCode = await Code.findOne({ email })
        verifiedCode.isVerified = true
        await verifiedCode.save()
        res.json({ message: "Change the password now." })
    } else {
        return next(new ErrorHandler("Invalid or expired reset code, Please try again.", 400))

    }

})

const changePassword = asynchErrorHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const verifyCode = await Code.findOne({ email })

    if (!verifyCode) {
        return next(new ErrorHandler("Invalid or expired reset code, Please try again.", 400))
    } else if (!verifyCode.isVerified) {
        return next(new ErrorHandler("Invalid or expired reset code, Please try again.", 400))
    } else {
        const updatePass = await User.findOne({ email })

        updatePass.password = password

        await updatePass.save()

        await Code.deleteOne()
        res.json({ message: "Password Change Success. Please return and login again" })
    }
})

const deleteAccount = asynchErrorHandler(async (req, res, next) => {

    const { id: userId, password } = req.body
    const { id } = req.user

    if (!userId || !password) { return next(new ErrorHandler("Please login to perform the action", 400)) }


    if (!req.user || !id) return next(new ErrorHandler("Please login to perform the action"))

    if (userId !== id) return next(new ErrorHandler("You're not allowed to delete this account, Please login to perform the action", 400))

    const user = await User.findById(userId)

    if (!user) return next(new ErrorHandler("You're not authenticated", 400))

    const checkPassword = await user.comparePassword(password, user.password)

    if (!checkPassword) { return next(new ErrorHandler("You're not authenticated, please login to perform this action", 400)) } else {

        await user.deleteOne()
        res.json("Account Deleted Successfully",)

    }

})

// logout endpoint.

const logout = asynchErrorHandler(async (req, res) => {

    res.clearCookie('token')
    res.removeHeader('Authorization');

    res.json({ message: "Logout Successfully." })


})



module.exports = {
    signup, login, sendResetCode, verifyCode, changePassword, deleteAccount, logout
}
