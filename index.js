const express = require('express');
const path    = require('path');
const app     = express();
const port    = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (request, response) => {  
  response.send('index.html');
})

app.listen(port, (err) => {  
  if (err) {
    return console.log('something bad happened', err);
  }
  console.log(`server is listening on ${port}`);
})