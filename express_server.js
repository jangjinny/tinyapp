const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set('view engine', 'ejs');

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

//function to generate unique id for shortURL
function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let uniqueURL = "";
  for (let i = 0; i < 6; i++) {
    uniqueURL += characters.charAt((Math.floor(Math.random() * characters.length)));
  }
  return uniqueURL;
};

//function to check if email already exists
//return true if the email already exists
function emailExists(email) {
  for (id in users) {
    if (users[id]["email"] === email) {
      console.log(users[id]["email"])
      return true;
    }
  } return false;
};

//database of all stored urls
let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//register page
app.get("/register", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_register", templateVars)
});

//register page submit handler
app.post("/register", (req, res) => {
  // console.log(req.body);
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  //possible errors --> if email/pwd are empty strings, return 400
  //if email is already registered, send back a 400 
  if (!email) {
    res.send('404 Error: Please enter a valid email.')
  } else if (!password) {
    res.send('404 Error: Please enter a valid password.')
  } else if (emailExists(email)) {
    res.send('404 Error: Email already exists.')
  } else {
    const user = {id, email, password};
    users[id] = user;
    res.cookie("user_id", users[id]["id"]);
    res.redirect("/urls")
  };
});

//login page
app.get("/login", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]] //user object
  };
  res.render("urls_login", templateVars)
});

//login submit handler
app.post('/login', (req, res) => {
  const email = req.body.email;
  res.cookie('email', email);
  res.redirect('/urls');
});

//create new url page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
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
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

//url page for specific shortURL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

//access long url page through short url
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
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

//logout button submit handler
app.post('/logout', (req, res) => {
  res.clearCookie('username') //clears all stored cookies
  res.redirect('/urls')
});

//listen to port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});