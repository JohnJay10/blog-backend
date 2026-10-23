const express = require("express")
const cors = require("cors")


const connectDB = require("./config/database")


connectDB()

const app = express()

app.use(express.json())
app.use('/uploads', express.static(require('node:path').join(__dirname, 'uploads'), {
  dotfiles: 'deny',
  index: false,
  maxAge: '7d',
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}))


const allowOrigin = [
  'http://localhost:3000',
  process.env.CLIENT_URL
]
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (allowOrigin.indexOf(origin) === -1 && !isLocalOrigin && !origin.endsWith('.vercel.app')) {
      return callback(new Error('Not allowed by CORS'));
}
return callback(null, true);
  },
  credentials: true

}

))
//Test Route 

app.get("/", (req, res) => {
  res.send("API is running...")
})


//Routes
app.use("/api/blogs", require("./routes/blogRoute"))
app.use("/api/auth", require("./routes/authRoute"))
app.use("/api/admin", require("./routes/adminRoute"))

const PORT = process.env.PORT || 3000

//Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`)
})
