import exp from 'express'
import {connect} from 'mongoose'
import 'dotenv/config'

const app = exp()
//Body-parser middleware
app.use(exp.json())

//Connect to MongoDB
async function connectToDB(){
    try{
        await connect(process.env.MONGO_URI)
        console.log("Connected to MongoDB")
        app.listen(process.env.PORT, ()=>console.log(`Server listening on ${process.env.PORT}`))
    } catch (error) {
        console.error('Error connecting to MongoDB:', error)
    }
}

//Error Handling Middleware
app.use((err, req, res, next)=>{
    console.error(err.stack)
    res.status(500).json({success: false, message: err.message})
})

connectToDB()