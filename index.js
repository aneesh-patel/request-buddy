// index.js

/**
 * Required External Modules
 */

const express = require("express");
const path = require("path");
const mongoose = require('mongoose');
const util = require('util')
//const { parse, stringify, toJSON, fromJSON } = require('flatted') //
/**
 * App Variables
 */


const app = express();
const port = process.env.PORT || 80



/**
 *  App Configuration
 */

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

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
    requests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Request'}],
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
    body: Object,
    headers: {type: Object},
    method: String,
    bin: { type: String },
  },
  { timestamps: true }
);


const Request = mongoose.model('Request', requestSchema);

const rawDataSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
    },
    raw_request: String,
    request_id: { type: String },
  },
  { timestamps: true }
)

const RawData = mongoose.model('RawData', rawDataSchema);
/**
 * Routes Definitions
 */

// Homepage
app.get("/", (req, res) => {
  res.render("index", { title: "Home" });
})

// Creates new bin
app.post("/new-bin", async (req, res) => {
  newIdentifier = Math.round(Math.random()* 9999999999).toString()
  try {
    console.log(newIdentifier)
    const newBin = new Bin({ id: newIdentifier })
    console.log(newBin)
    await newBin.save()
    res.redirect(`/bin-created/${newBin.id}`)
    
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
  }
});

// Gives newly created bin URL
app.get("/bin-created/:id", (req, res) => {
  res.render("created-bin", { url: `https://1eed-71-120-212-136.ngrok.io/api/bins/${req.params.id}` })
  //res.json({'url': `https://1eed-71-120-212-136.ngrok.io/api/bins/${req.params.id}`})
})


// Handles requests coming to a bin
app.all("/api/bins/:bin", async (req, res) => {
  newIdentifier = Math.round(Math.random()* 9999999999).toString()
  try {
    // store raw data
    const reqData = util.inspect(req)
    console.log(reqData)
    const newRawData = new RawData({ 
      id: Math.round(Math.random() * 9999999999).toString(),
      raw_request: reqData,
      request_id: newIdentifier,
    })
    await newRawData.save() 

    // parse req and store request
    const newRequest = new Request({
      id: newIdentifier,
      body: req.body,
      headers: req.headers,
      method: req.method,
      bin: req.params.bin,
    });
    await newRequest.save()

    // add request to bin
    const foundBin = await Bin.findOne({id: req.params.bin})
    foundBin.requests.push(newRequest)
    await foundBin.save()
    res.status(200).json({"message": "received"})
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
  }
}) 

// Handles showing requests that have been sent to your bin
app.get("/api/bins/:bin/view", async (req, res) => {
  const searchedBin = await Bin.findOne({ id: req.params.bin}).populate('requests')

  res.render("see-bin", { titleSub: 'Your buddy ID:', binUrl: searchedBin.id, requests: searchedBin.requests.reverse() })
})

app.get("/docs", (req, res) => {
  res.render("docs", {})
})

/**
 * Server Activation
 */

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
})