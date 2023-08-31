var express = require("express");
var app = express();
var path = require("path");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var config = require("./config");
var base58 = require("./base58.js");
require("dotenv").config();

// grab the url model
var Url = require("./models/url");

// mongoose.connect('mongodb://' + config.db.host + '/' + config.db.name);
mongoose.connect(
  process.env.MONGO,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

app.post("/api/shorten", async function (req, res) {
  var longUrl = req.body.url;
  var shortUrl = "";

  try {
    // Check if url already exists in the database
    const existingUrl = await Url.findOne({ long_url: longUrl }).exec();

    if (existingUrl) {
      shortUrl = config.webhost + base58.encode(existingUrl._id);
      res.send({ shortUrl: shortUrl });
    } else {
      // Create a new entry since the URL doesn't exist
      const newUrl = new Url({
        long_url: longUrl,
      });

      await newUrl.save();

      shortUrl = config.webhost + base58.encode(newUrl._id);
      res.send({ shortUrl: shortUrl });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});


app.get("/:encoded_id", function (req, res) {
  var base58Id = req.params.encoded_id;
  var id = base58.decode(base58Id);

  // Find the URL by ID and handle the result
  Url.findOne({ _id: id })
    .exec()
    .then((doc) => {
      if (doc) {
        res.redirect(doc.long_url);
      } else {
        res.redirect(config.webhost);
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Internal Server Error");
    });
});

var server = app.listen(3000, function () {
  console.log("Server listening on port 3000");
});
