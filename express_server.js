const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set('view engine', 'ejs');

//function to generate unique id for shortURL
function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let uniqueURL = "";
  for (let i = 0; i < 6; i++) {
    uniqueURL += characters.charAt((Math.floor(Math.random() * characters.length)));
  }
  return uniqueURL;
};

//database of all stored urls
let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//create new url page
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//create new url submit handler --> generate unique ID when user submits a longURL
app.post("/urls", (req, res) => {
  let uID = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[uID] = req.body.longURL //store in urlDatabase
  res.redirect(`/urls`);
});

//my urls page --> shows all saved urls
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies['username']
  };
  console.log(req.cookies)
  res.render("urls_index", templateVars);
});

//url page for specific shortURL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies['username']
  };
  res.render("urls_show", templateVars);
});

//access long url page through short url
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//login submit handler
app.post('/login', (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

//redirect to short url page to edit (should be get?)
app.post('/urls/:shortURL/edit', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`/urls/${req.params.shortURL}`)
});

//update existing long url 
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls")
});

//delete button page submit handler
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//listen to port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});