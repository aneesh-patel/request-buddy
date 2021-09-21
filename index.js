// index.js

/**
 * Required External Modules
 */

const express = require("express");
const path = require("path");
const mongoose = require('mongoose');


/**
 * App Variables
 */


const app = express();
const port = process.env.PORT || 8000



/**
 *  App Configuration
 */

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect("mongodb+srv://admin:foobar@cluster0.dtu4l.mongodb.net/requestBinClone?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
})

const binSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
    },
  },
  { timestamps: true }
);

const Bin = mongoose.model('Bin', binSchema);

const requestSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
    },
    request: Object,
    bin: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin' },
  },
  { timestamps: true }
);


const Request = mongoose.model('Request', requestSchema);
/**
 * Routes Definitions
 */

app.get("/", (req, res) => {
  res.render("index", { title: "Home" });
})

app.post("/new-bin", async (req, res) => {
  newIdentifier = Math.round(Math.random()* 9999999999).toString()
  

  try {
    console.log(newIdentifier)
    const newBin = new Bin({ id: newIdentifier })
    console.log(newBin)
    await newBin.save()
    //res.render("new-bin", { title: "New Bin :)", binUrl: `https://example.com/${uniqueIdentifier}`})
    res.redirect(`/bin-created/${newBin.id}`)
    
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/bin-created/:id", (req, res) => {
  res.json({'url': `https://example.com/api/bins/${req.params.id}`})
})
/**
 * Server Activation
 */

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
})