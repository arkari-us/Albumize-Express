const mongoose = require('mongoose');
const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

const app = express();
dotenv.config();

const db = mongoose.connect(process.env.MONGOURI,{dbName: process.env.DBNAME});
const port = process.env.PORT;

const User = require('./models/User');
const userRouter = require('./routes/userRoutes');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/user', userRouter);
app.use(function(req, res, next) {  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', true);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.listen(port, () => {
    console.log('Listening on port ' + port);
});