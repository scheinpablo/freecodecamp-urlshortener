require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
var bodyParser = require("body-parser");
const mongoose = require('mongoose');
const { Schema } = mongoose;


// Basic Configuration
const port = process.env.PORT || 3000;

// Connect to mongoose db
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true});

const urlSchema = new Schema({
  shortUrl: Number,
  longUrl: String,
});

const URL = mongoose.model('URL', urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', (req, res) => {
  if (!isURL(req.body.url)) return res.json({ error: 'invalid url' });
  createAndSaveUrl(req.body.url, (err, data) => {
    if (err) return console.log(err);
    res.json({ original_url: req.body.url, short_url: data.shortUrl });
  });
})

app.get('/api/shorturl/:short', (req, res) => {
  if (!req.params || !req.params.short) return;
  URL.findOne({ shortUrl: parseInt(req.params.short) }, (err, data) => {
    if (err) return console.log(err);
    res.redirect(data.longUrl);
  });
});



app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

var createAndSaveUrl = (long, done) => {
  URL.find()
    .sort({"shortUrl": -1})
    .limit(1)
    .exec((error, data) => {
      if (error) return console.log(error);
      let newUrl;
      if (data.length == 0) {
        newUrl = new URL({ shortUrl: 0, longUrl: long });
      } else {
        console.log(data);
        newUrl = new URL({ shortUrl: data[0].shortUrl + 1, longUrl: long });
      }
      newUrl.save((err, data) => {
        if (err) return console.log(err);
        done(null, data);
      });
    });
}

function isURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return pattern.test(str);
}