'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var validUrl = require('valid-url');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

  //Database Config
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const shortUrlSchema = mongoose.Schema({
  original_url: {type: String, required: true},
  short_url: {type: Number, required: true}
});
const shortUrl = mongoose.model('shortUrl', shortUrlSchema);
const firstAvailableNumSchema = mongoose.Schema({
  firstAvailable: Number
});
const firstAvailableNum = mongoose.model('firstAvailableNum',firstAvailableNumSchema);
let firstAvailableShortUrl = new firstAvailableNum({firstAvailable: 2});

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});

app.post('/api/shorturl/new', (req,res) => {
    if (validUrl.isWebUri(req.body.url)) {
      console.log('original first available: '
                  + firstAvailableShortUrl.firstAvailable);
      console.log('weburi is valid');
      shortUrl.find({original_url: req.body.url},
                    (err, urlArray) => {
        if (err) return console.log(err);

        console.log('in shortUrl.find original_url');
        if (urlArray[0] == null) {
          console.log('no original_url found');
          let newUrl = new shortUrl({
            original_url: req.body.url,
            short_url: firstAvailableShortUrl.firstAvailable
          });
          firstAvailableShortUrl.firstAvailable++;
          newUrl.save( (e, data) => {
            if (e) console.log(e);
            console.log('created db entry: {original_url: ' + 
                        req.body.url + ', short_url: ' + 
                        firstAvailableShortUrl.firstAvailable + '}');
          });
          res.json({
            original_url: req.body.url,
            short_url: firstAvailableShortUrl.firstAvailable - 1});
        } else res.json({
            original_url: urlArray[0].original_url,
            short_url: urlArray[0].short_url});
      });
    } else {
      console.log('web uri is not valid');
      res.json({
        error: 'invalid URL'
      });
    }
});

app.get('/api/shorturl/:urlNum', (req,res,next) => {
  shortUrl.find({short_url: Number(req.params.urlNum)}, (err,urlArray) => {
    if (err) return console.log(err);
    console.log('redirect url found: ' + urlArray[0].original_url);
    res.redirect(urlArray[0].original_url);
  });
});