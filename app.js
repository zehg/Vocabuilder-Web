var express = require('express');

var app = express();

app.set('view engine', 'ejs');

app.get('/', function(req, res){
  res.send('Welcome to Vocabulary Builder');
})
app.listen(3000);
