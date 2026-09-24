import exp from express
import {UserModel} from '../Models/user.models.js'
import {hash, compare} from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {verifyToken} from '../Middleware/verifyTokenMiddleware.js'
import {allowedRoles} from '../Middleware/allowed-roles.middleware.js'
import {ResourceModel} from '../Models/resource.models.js'    
import {BookingModel} from '../Models/bookings.models.js'

export const userRouter = exp.Router()

//Register user
userRouter.post("/user", async (req, res)=>{
    let newUser = req.body
    let userDoc = new UserModel(newUser)
    await userDoc.validate()
    let hashPass = await(hash(newUser.password, 12))
    userDoc.password = hashPass
    await userDoc.save({validateBeforeSave: false})
    res.status(201).json({success:true, message:"New User created", data:newUser})
})

//Login
userRouter.post("/auth/login", async (req, res)=>{
    let userCred = req.body
    let userInDb = await UserModel.findOne({email: userCred.email})
    if(userInDb===null){
        return res.status(404).json({success: false, message: "Invalid Email"})
    }
    let result = await compare(userCred.password, userInDb.password)
    if(result===false){
        return res.status(404).json({success: false, message: "Incorrect password"})
    }
    let signedToken = jwt.sign({_id: userInDb._id, role: userInDb.role}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN})
    res.cookie("token", signedToken,{httpOnly:true, secure: false})
    res.status(200).json({success: true, message: "Login Success"})
})

//Get all resources
userRouter.get("/resources", verifyToken, allowedRoles("Admin", "User"), async (req, res)=>{
    let resources = await ResourceModel.find()
    res.status(200).json({success: true, message: "Resources of the college", data: resources})
})

//Get resource by name
userRouter.get("/resources/:name", verifyToken, allowedRoles("Admin", "User"), async (req, res)=>{
    let resourceName = req.params.name
    let resourceInDb = await ResourceModel.findOne({name: resourceName})
    if(!resourceInDb){
        return res.status(404).json({success: false, message: "Resource not found"})
    }
    res.status(200).json({success: true, message: "Resource found", data: resourceInDb})
})

//Get resources by type
userRouter.get("/resources/type/:type", verifyToken, allowedRoles("Admin", "User"), async (req, res)=>{
    let resourceType = req.params.type
    let resourcesInDb = await ResourceModel.find({type: resourceType})
    if(resourcesInDb.length===0){
        return res.status(404).json({success: false, message: "No resources found of this type"})
    }
    res.status(200).json({success: true, message: "Resources found", data: resourcesInDb})
})

//booking
userRouter.post("/bookings/:name", verifyToken, allowedRoles("Admin", "User"), async (req, res)=>{
    let resourceName = req.params.name
    let resourceInDb = await ResourceModel.findOne({name: resourceName})
    if(!resourceInDb){
        return res.status(404).json({success: false, message: "Resource not found"})
    }
    const newBooking = {...req.body, resourceId: resourceInDb._id, userId: req.user._id};
    if (resourceInDb.status !== "AVAILABLE") {
    return res.status(409).json({success: false, message: `Resource is currently ${resourceInDb.status}`})
    }
    const conflict = await BookingModel.findOne({
        resourceId: resourceInDb._id,
        bookingStatus: {$in: ['Accepted', 'Pending']},
        startTimeDate: {$lt: new Date(newBooking.endTimeDate)},
        endTimeDate: {$gt: new Date(newBooking.startTimeDate)}
    })
    if(conflict){
        return res.status(400).json({success: false, message: "Booking conflicts with an existing booking"})
    }
    let bookingDoc = new BookingModel(newBooking)
    await bookingDoc.save()
    res.status(201).json({success:true, message:"New Booking created", data:newBooking})
})

//Check booking status
userRouter.get("/bookings/:id", verifyToken, allowedRoles("Admin", "User"), async (req, res)=>{
    let bookingId = req.params.id
    let bookingInDb = await BookingModel.findById(bookingId)
    if(!bookingInDb){
        return res.status(404).json({success: false, message: "Booking not found"})
    }
    res.status(200).json({success: true, message: "Booking found", data: bookingInDb})
})

//Get all bookings of a user
userRouter.get("/bookings", verifyToken, allowedRoles("Admin", "User"), async (req, res)=>{
    let userId = req.user._id
    let bookingsInDb = await BookingModel.find({userId: userId})
    if(bookingsInDb.length===0){
        return res.status(404).json({success: false, message: "No bookings found for this user"})
    }
    res.status(200).json({success: true, message: "Bookings found", data: bookingsInDb})
})

//Cancel a booking
userRouter.put("/bookings/:id/cancel", verifyToken, allowedRoles("Admin", "User"), async (req, res)=>{
    let bookingId = req.params.id
    let bookingInDb = await BookingModel.findById(bookingId)
    if(!bookingInDb){
        return res.status(404).json({success: false, message: "Booking not found"})
    }
    if(bookingInDb.bookingStatus === "Cancelled"){
        return res.status(400).json({success: false, message: "Booking is already cancelled"})
    }
    bookingInDb.bookingStatus = "Cancelled"
    await bookingInDb.save()
    res.status(200).json({success: true, message: "Booking cancelled", data: bookingInDb})
})