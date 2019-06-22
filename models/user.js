var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
  name: String,
  surname: String,
  email: {
    type: String,
    unique: true 
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: Boolean,
  registeredAt: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date
});

userSchema.plugin(passportLocalMongoose, {usernameField: "email"});

module.exports = mongoose.model("User", userSchema);