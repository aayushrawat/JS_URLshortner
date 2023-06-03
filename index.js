require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
// const { nanoid } = require('nanoid/non-secure');
const { default: mongoose } = require('mongoose');
// let nanoid;
// (async () => {
//   const { nanoid: nanoidModule } = await import('nanoid/async');
//   nanoid = nanoidModule;
// })();



// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const URI = process.env.MONGO_URI;

mongoose.connect(URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;

// Event handlers for connection status
db.on('connected', () => {
  console.log('Connected to MongoDB');
});

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

db.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// orignal url and short url
const dbSchema = new mongoose.Schema({
  o_url: String,
  s_url: String,
});

const Url = mongoose.model('Url', dbSchema);


app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


function generateRandomNumber() {
  const min = 100000; // Minimum value (inclusive)
  const max = 999999; // Maximum value (inclusive)
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

app.post("/api/shorturl", async (req, res) => {
  let short_url;
  const orignal_url = req.body.url;
do {
  short_url = generateRandomNumber();
} while (await Url.exists({s_url: short_url}));

try{
  await Url.create({
    o_url: orignal_url,
    s_url: short_url,
  });
  res.json({short_url});
} catch (err) {
console.log("Failed to insert URL");
}
});




// To retrieve and redirect to the orignal url from /:shorturl route
app.get("/:f_url", async (req, res) => {
  const f_url = req.params.f_url.toString();
  try {
    const url = await Url.findOne({s_url: f_url});
    if (url){
      let originalUrl = url.o_url;
      if (!originalUrl.startsWith("http://") && !originalUrl.startsWith("https://")) {
        originalUrl = "https://" + originalUrl;
      }
      res.redirect(originalUrl);
    } else {
      res.status(404).send('Short URL not found');
    }
  } catch (error) {
    console.error('Error retrieving URL:', error);
    res.status(500).send('Error retrieving URL');
  }
});


















app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});