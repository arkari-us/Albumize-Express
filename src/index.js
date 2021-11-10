const mongoose = require('mongoose');
const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoStore = require('connect-mongo');

const app = express();
dotenv.config();

//Resolve deprecation warnings from mongodb
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

const mongodbOptions = {
  dbName: process.env.DBNAME
}

const db = mongoose.connect(process.env.MONGOURI,mongodbOptions);
const port = process.env.PORT;

const userRouter = require('./routes/userRoutes');
const albumRouter = require('./routes/albumRoutes');
const playlistRouter = require('./routes/playlistRoutes');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  resave: false,
  cookie: {  
    maxAge: 60 * 60 * 24 * 7 * 1000,
  },
  store: mongoStore.create({
    mongoUrl: process.env.MONGOURI + process.env.DBNAME,
    collection: 'session'
  }).on('error', function(err) {
    console.log(err);
  })
}));

app.use(function(req, res, next) {  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', true);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/user', userRouter);
app.use('/albums/', albumRouter);
app.use('/playlists/',playlistRouter);

app.listen(port, () => {
    console.log('Listening on port ' + port);
});