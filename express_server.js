const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set('view engine', 'ejs');

//----------DATABASES(user/url)----------//

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

//database of all stored urls
let urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  fmdl4r: { longURL: "https://www.amazon.ca", userID: "aea3rr" },
  vv3fsa: { longURL: "https://www.youtube.com", userID: "aas23r" }
};

//----------FUNCTIONS----------//

//functions to generate unique id for shortURL
function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let uniqueURL = "";
  for (let i = 0; i < 6; i++) {
    uniqueURL += characters.charAt((Math.floor(Math.random() * characters.length)));
  }
  return uniqueURL;
};

//function to check if email already exists --> return true if the email already exists
function emailExists(email) {
  for (id in users) {
    if (users[id]["email"] === email) {
      return true;
    }
  } return false;
};

//function to return the shortURLs when the userID is equal to the id of the logged-in user
function urlsForUser(id) {
  let urls = [];
  for (shortURL in urlDatabase) {
    const userId = urlDatabase[shortURL]["userID"];
    if (userId === id) {
      urls.push(shortURL)
    }
  }
  return urls;
};

//filter urlDatabase to only contain shortURLS that matches the given IDs
function filterUrlDatabase(givenId) {
  const userURLs = urlsForUser(givenId); //array of shortURLs 
  let filtered = {};

  for (shortURL in urlDatabase) {
    if (userURLs.includes(shortURL)) {
      filtered[shortURL] = urlDatabase[shortURL];
    }
  }
  return filtered; //returns an object with only the matching urls
}

//----------ROUTES----------//

//GET: register page
app.get("/register", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  return res.render("urls_register", templateVars)
});

//POST: register page submit handler
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  //possible errors --> if email/pwd are empty strings, return 400
  //if email is already registered, send back a 400 
  if (!email) {
    return res.send('404 Error: Please enter a valid email.')
  } else if (!password) {
    return res.send('404 Error: Please enter a valid password.')
  } else if (emailExists(email)) {
    return res.send('404 Error: Email already exists.')
  } else {
    const user = {id, email, password};
    users[id] = user;
    res.cookie("user_id", users[id]["id"]);
    return res.redirect("/urls")
  };
});

//GET: login page
app.get("/login", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]] //user object
  };
  return res.render("urls_login", templateVars)
});

//POST: login submit handler
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!emailExists(email)) {
    res.send('403 Error: This email does not exist.')
  } else {
    for (userId in users) {
      const user = users[userId];
      if (user["email"] === email) {
        const userPassword = user["password"];
        if (userPassword !== password) {
          res.send('403 Error: Incorrect password');
        } else {
          res.cookie('user_id', user["id"])
          res.redirect('/urls')
          };
        };
      };
    };
});

//GET: create new url page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

//GET: my urls page --> shows all saved urls
app.get("/urls", (req, res) => {
  const givenId = req.cookies["user_id"];
  const urlDatabase = filterUrlDatabase(givenId);
  const templateVars = {
    urls: urlDatabase,
    user: users[givenId]
  };
  res.render("urls_index", templateVars);
});

//POST:create new url submit handler --> generate unique ID when user submits a longURL
app.post("/urls", (req, res) => {
  const id = req.cookies["user_id"];
  const longURL = req.body.longURL;
  //if the user if not logged in, redirect them to login page
  if (!id) {
    res.redirect("/login")
  } else {
  const uID = generateRandomString();
  urlDatabase[uID] = { "longURL": longURL, "userID": id};
  return res.redirect(`/urls`);
  }
});

//GET: url page for specific shortURL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]["longURL"],
    user: users[req.cookies["user_id"]]
  };
  return res.render("urls_show", templateVars);
});

//GET: access long url page through short url
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  return res.redirect(longURL);
});

//POST: redirect to short url page to edit
app.post('/urls/:shortURL', (req, res) => {
  const id = req.cookies["user_id"];
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;

  urlDatabase[shortURL]["longURL"] = longURL;
  return res.redirect(`/urls/${shortURL}`)
});

//POST: update existing long url 
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  const id = req.cookies["user_id"];
  const user = urlDatabase[shortURL]["userID"];

  if (id !== user) {
    res.send("404 Error: Cannot update url.");
  } else {
    urlDatabase[shortURL]["longURL"] = longURL;
    return res.redirect("/urls")
  }
});

//POST: delete button page submit handler
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const id = req.cookies["user_id"];
  const user = urlDatabase[shortURL]["userID"];

  if (id !== user) {
    res.send("404 Error: Cannot delete url.");
  } else {
    delete urlDatabase[shortURL];
    return res.redirect("/urls");
  }
});

//POST: logout button submit handler
app.post('/logout', (req, res) => {
  res.clearCookie('user_id') //clears all stored cookies
  return res.redirect('/urls')
});

//GET: catch all
app.get('*', (req, res) => {
  res.send("404 Error: SOMETHINGS WRONG")
});

//LISTEN: listen to port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});