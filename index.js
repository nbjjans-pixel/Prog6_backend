import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(process.env.EXPRESS_PORT, () =>{
    console.log('server is gesrtas');
})