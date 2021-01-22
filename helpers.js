//function to get user by email
const getUserByEmail = function(email, database) {
  for (id in database) {
    const user = database[id];
    if (user["email"] === email) {
      return user;
    }
  }
};

module.exports = { getUserByEmail };