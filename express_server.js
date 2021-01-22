const { getUserByEmail } = require("./helpers");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');

//----------MIDDLEWARE----------//

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: "user_id",
  keys: ["1q2w3e4"] //random
}));

app.set('view engine', 'ejs');

//----------DATABASES(user/url)----------//

//database of all stored users
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

//----------HELPER FUNCTIONS----------//

//function to generate unique id for shortURL
//function also used to generate user ID
function generateRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let uniqueID = "";
  for (let i = 0; i < 6; i++) {
    uniqueID += characters.charAt((Math.floor(Math.random() * characters.length)));
  }
  return uniqueID;
}

//function to return shortURLs when the userID is equal to the id of the logged-in user
function urlsForUser(id) {
  let urls = [];
  for (let shortURL in urlDatabase) {
    const userId = urlDatabase[shortURL]["userID"];
    if (userId === id) {
      urls.push(shortURL);
    }
  }
  return urls; //returns an array of shortURLs according to user ID
}

//filter urlDatabase to only contain shortURLS that matches the given IDs
function filterUrlDatabase(givenId) {
  const userURLs = urlsForUser(givenId); //array of shortURLs
  let filteredData = {};

  for (let shortURL in urlDatabase) {
    if (userURLs.includes(shortURL)) {
      filteredData[shortURL] = urlDatabase[shortURL];
    }
  }
  return filteredData; //returns an object with only the matching urls
}

//----------ROUTES----------//

//---GET---//home page
app.get("/", (req, res) => {
  return res.redirect('/urls');
});

//---GET---//register page
app.get("/register", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };

  return res.render("urls_register", templateVars);
});

//---POST---// register page submit handler
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const userInfo = getUserByEmail(email, users);

  //hash password
  const hashedPassword = bcrypt.hashSync(password, 10);

  //possible errors --> if email/pwd are empty strings, return 400
  //if email is already registered, send back a 400
  if (!email) {
    return res.send('404 Error❌❌❌: Please enter a valid email.');
  } else if (!password) {
    return res.send('404 Error❌❌❌: Please enter a valid password.');
  } else if (userInfo) {
    return res.send('404 Error❌❌❌: Email already exists.');
  } else {
    const user = {id, email, hashedPassword};
    users[id] = user;
    req.session.user_id = users[id]["id"];
    return res.redirect("/urls");
  }
});

//---GET---// login page
app.get("/login", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id] //user object
  };
  return res.render("urls_login", templateVars);
});

//---POST---// login submit handler
app.post('/login', (req, res) => {
  const email = req.body.email;
  const givenPassword = req.body.password;
  const userInfo = getUserByEmail(email, users); //object with user info
  
  if (!userInfo) {
    return res.send('403 Error❌❌❌: This email does not exist.');
  } else if (!bcrypt.compareSync(givenPassword, userInfo["hashedPassword"])) {
    return res.send('403 Error❌❌❌: Incorrect password');
  } else {
    req.session.user_id = userInfo["id"];
    return res.redirect('/urls');
  }
});

//---GET---// new url page
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_id]
  };
  //if the user if not logged in, redirect them to login page
  if (!userId) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

//---GET---// my urls page --> shows all of user's saved urls
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const urlDatabase = filterUrlDatabase(userId);
  const templateVars = {
    urls: urlDatabase,
    user: users[userId]
  };
  res.render("urls_index", templateVars);
});

//---POST---// create new url submit handler
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  const userId = req.session.user_id;
  const longURL = req.body.longURL;

  //generate unique ID when user submits a longURL
  urlDatabase[id] = { "longURL": longURL, "userID": userId};
  return res.redirect(`/urls`);
});

//---GET---// url page for specific shortURL
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const urlId = req.params.id;
  const storedUrl = urlDatabase[urlId];
  const storedUserID = storedUrl["userID"];

  if (userId !== storedUserID) {
    res.send("404 Error: Cannot access this URL.")
  } else if (!storedUrl) {
    res.send("404 Error: This URL does not exist.");
  } else {
    const templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[urlId]["longURL"],
      user: users[userId]
    };
    return res.render("urls_show", templateVars);
  }
});

//---GET---// access long url page through short url
app.get("/u/:id", (req, res) => {
  const urlId = req.params.id;
  const longURL = urlDatabase[urlId]["longURL"];
  return res.redirect(longURL);
});

//---POST---// update existing long url
app.post("/urls/:id", (req, res) => {
  const urlId = req.params.id;
  const longURL = req.body.longURL;
  const userId = req.session.user_id;
  const storedUser = urlDatabase[urlId]["userID"];

  if (userId !== storedUser) {
    return res.send("404 Error❌❌❌: Cannot update url.");
  } else {
    urlDatabase[urlId]["longURL"] = longURL;
    return res.redirect("/urls");
  }
});

//---POST---// delete button page submit handler
app.post("/urls/:id/delete", (req, res) => {
  const urlId = req.params.id;
  const userId = req.session.user_id;
  const storedUser = urlDatabase[urlId]["userID"];
  const urlDatabase = filterUrlDatabase(userId);

  if (userId !== storedUser) {
    return res.send("404 Error❌❌❌: Cannot delete url.");
  } else {
    delete urlDatabase[urlId];
    return res.redirect("/urls");
  }
});

//---POST---// logout button submit handler
app.post('/logout', (req, res) => {
  req.session = null; //clears all stored cookies
  return res.redirect('/urls');
});

//---GET---// catch all
app.get('*', (req, res) => {
  res.send("404 Error❌❌❌: Page not found.");
});

//LISTEN: listen to port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//---GET---//
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});