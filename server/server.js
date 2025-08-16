const express = require('express');
const app = express();
const path = require('path');
const port = process.send.PORT || 3001;

app.get('/', (req, res) => {
  res.send('Hello world!');
});

app.listen(port, (error) => {

})