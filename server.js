const express = require("express")
const cors = require("cors")


const connectDB = require("./config/database")


connectDB()

const app = express()

app.use(express.json())
app.use(cors())
//Test Route 

app.get("/", (req, res) => {
  res.send("API is running...")
})


//Routes
app.use("/api/blogs", require("./routes/blogRoute"))
app.use("/api/auth", require("./routes/authRoute"))

const PORT = process.env.PORT || 4000

//Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`)
})


