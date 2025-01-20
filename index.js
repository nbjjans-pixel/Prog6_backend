import express from 'express';
import mongoose from 'mongoose';
import companysRouter from './routes/companys.js';

const app = express();
mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.DB_NAME}`)

// Middleware voor JSON-gegevens (express middleware)
app.use(express.json());

// Middleware voor www-urlencoded-gegevens  (express middleware)
app.use(express.urlencoded({extended: true}));

//Middleware to check if request accept is application/json (eigen middleware)
app.use((req, res, next) => {
    if (req.header('Accept') !== 'application/json' && req.method !== "OPTIONS"){
        res.status(406).json({error: 'Accept header must include application/json cuh 🤓.'})
    }else{
        next();  //next kan naar alles verwijzen zoals home of companys omdat deze middleware voor de hele applicatie werkt. next is dus dynamisch en we bepalen nu op welk niveau door het zo hoog in index.js te zetten.
    }
})

app.get('/', (req, res) => {
    res.json({message: 'welcome'})
});

app.use('/companys', companysRouter);

app.listen(process.env.EXPRESS_PORT, () => {
    console.log('server is gestart')
});
















// import express from 'express';
// import mongoose from "mongoose";
//
// const app = express();
// mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.DB_NAME}`);
//
// app.get('/', (req, res) => {
//     res.send('Hello World!');
// });
//
// app.listen(process.env.EXPRESS_PORT, () => {
//     console.log('server is gestart')
// });