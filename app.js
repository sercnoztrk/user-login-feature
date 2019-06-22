var express         = require("express"),
    app             = express(),
    http            = require('http').Server(app),
    io              = require('socket.io')(http),
    session         = require("express-session"),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    methodOverride  = require("method-override"),
    flash           = require("connect-flash"),
    User            = require("./models/user");
    
var indexRoutes         = require("./routes/index"),
    confirmationRoute   = require("./routes/confirmation"),
    resendRoute         = require("./routes/resend");

var userCount       = 0;

// Mongoose Config
mongoose.connect("mongodb://localhost/user_login_feature", {useNewUrlParser: true});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(flash());

// Passport Config
app.use(session({
    secret: "Digitus mülakat ödevi",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function (req, res, next) {
    res.locals.loggedUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});


app.use("/", indexRoutes);
app.use("/confirmation", confirmationRoute);
app.use("/resend", resendRoute);

io.on('connection', function(socket){
    userCount++;
    io.emit('user count', { userCount: userCount });
    socket.on('disconnect', function(){
        userCount--;
        io.emit('user count', { userCount: userCount })
    });
});

http.listen(3000, function(){
    console.clear();
    console.log("The server has started...");
});