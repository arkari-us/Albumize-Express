const mongoose = require('mongoose');
const express = require('express');

const app = express();

const db = mongoose.connect(process.env.MONGOURI || 'mongodb://localhost');
const port = process.env.PORT || 3000;

const User = require('./models/User');
const userRouter = require('./routes/userRoutes');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/user', userRouter);

app.listen(port, () => {
    console.log('Listening on port ' + port);
});