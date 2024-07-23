const express = require("express");
const bodyParser = require('body-parser');
const path = require("path");
const multer = require('multer');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const { body, validationResult } = require('express-validator');
const app = express();

// Middleware to parse JSON and form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from 'public' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Connect to MongoDB
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('Error connecting to MongoDB:', error));

// Schemas and Models
const foodSchema = new mongoose.Schema({
  title: String,
  image: String,
  location: String,
  latitude: String,
  longitude: String,
  description: String
});
const Food = mongoose.model('Food', foodSchema);

const houseSchema = new mongoose.Schema({
  title: String,
  image: String,
  location: String,
  rent: Number,
  latitude: String,
  longitude: String,
  description: String
});
const House = mongoose.model('House', houseSchema);

const marketSchema = new mongoose.Schema({
  title: String,
  image: String,
  location: String,
  price: Number,
  latitude: String,
  longitude: String,
  description: String
});
const Market = mongoose.model('Market', marketSchema);

// Routes

app.get('/', (req, res) => {
  res.render('index', {
    searchAction: '/food', // URL to handle the search
    selectedType: req.query.type || 'food', // Default type
    query: req.query.query || '' // Default query
  });
});


// Render form pages
app.get('/food/form', (req, res) => {
  res.render('form', { routeName: 'food', errors: [] });
});

app.get('/house/form', (req, res) => {
  res.render('form', { routeName: 'house', errors: [] });
});

app.get('/market/form', (req, res) => {
  res.render('form', { routeName: 'market', errors: [] });
});

// Handle search and display for houses
app.get('/house', async (req, res) => {
  try {
    const domain = req.get('host');
    const query = req.query.query || ''; // Retrieve the query from the request
    const searchRegex = new RegExp(query, 'i'); // Create a regex for case-insensitive search

    // Find all items if no query is provided, otherwise filter based on the query
    const houses = await House.find({
      $or: [
        { title: searchRegex },
        { location: searchRegex },
        { description: searchRegex }
      ]
    });

    res.render('display', { cards: houses, domain, imagepath: "/house.jpg", query ,selectedType: 'house',searchAction: '/house'});
  } catch (error) {
    console.error('Error fetching houses:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Handle form submission for houses
app.post('/house', upload.single('image'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('rent').isFloat().withMessage('Rent must be a valid number'),
  body('latitude').isFloat().withMessage('Latitude must be a valid number'),
  body('longitude').isFloat().withMessage('Longitude must be a valid number'),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('form', { errors: errors.array(), routeName: 'house' });
  }
  
  try {
    const { title, location, rent, latitude, longitude, description } = req.body;
    const image = req.file ? 'uploads/' + req.file.filename : '';
    const newHouse = new House({ title, image, location, rent, latitude, longitude, description });
    await newHouse.save();
    res.redirect('/house');
  } catch (error) {
    console.error('Error saving House:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Handle search and display for markets
app.get('/market', async (req, res) => {
  try {
    const domain = req.get('host');
    const query = req.query.query || ''; // Retrieve the query from the request
    const searchRegex = new RegExp(query, 'i'); // Create a regex for case-insensitive search

    // Find all items if no query is provided, otherwise filter based on the query
    const markets = await Market.find({
      $or: [
        { title: searchRegex },
        { location: searchRegex },
        { description: searchRegex }
      ]
    });

    res.render('display', { cards: markets, domain, imagepath: "/market.jpg", query ,selectedType: 'market', searchAction: '/market'});
  } catch (error) {
    console.error('Error fetching markets:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Handle form submission for markets
app.post('/market', upload.single('image'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('price').isFloat().withMessage('Price must be a valid number'),
  body('latitude').isFloat().withMessage('Latitude must be a valid number'),
  body('longitude').isFloat().withMessage('Longitude must be a valid number'),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('form', { errors: errors.array(), routeName: 'market' });
  }
  
  try {
    const { title, location, price, latitude, longitude, description } = req.body;
    const image = req.file ? 'uploads/' + req.file.filename : '';
    const newMarket = new Market({ title, image, location, price, latitude, longitude, description });
    await newMarket.save();
    res.redirect('/market');
  } catch (error) {
    console.error('Error saving Market:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Handle search and display for foods
app.get('/food', async (req, res) => {
  try {
    const domain = req.get('host');
    const query = req.query.query || ''; // Retrieve the query from the request
    const searchRegex = new RegExp(query, 'i'); // Create a regex for case-insensitive search

    // Find all items if no query is provided, otherwise filter based on the query
    const foods = await Food.find({
      $or: [
        { title: searchRegex },
        { location: searchRegex },
        { description: searchRegex }
      ]
    });

    res.render('display', { cards: foods, domain, imagepath: "/food.jpg", query ,selectedType: 'food', searchAction: '/food'});
  } catch (error) {
    console.error('Error fetching foods:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Handle form submission for foods
app.post('/food', upload.single('image'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('latitude').isFloat().withMessage('Latitude must be a valid number'),
  body('longitude').isFloat().withMessage('Longitude must be a valid number'),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('form', { errors: errors.array(), routeName: 'food' });
  }
  
  try {
    const { title, location, latitude, longitude, description } = req.body;
    const image = req.file ? 'uploads/' + req.file.filename : '';
    const newFood = new Food({ title, image, location, latitude, longitude, description });
    await newFood.save();
    res.redirect('/food');
  } catch (error) {
    console.error('Error saving Food:', error);
    res.status(500).send('Internal Server Error');
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404');
});

// Start server
app.listen(8080, () => {
  console.log('Server listening on port 8080...');
});