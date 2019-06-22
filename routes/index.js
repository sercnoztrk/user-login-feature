var express     = require("express");
var router      = express.Router();
var passport    = require("passport");
var User        = require("../models/user");
var Token       = require("../models/token");
var crypto      = require("crypto");
var nodemailer  = require("nodemailer");
var middleware  = require("../middleware/index");

var userCount = 0;


router.get("/", middleware.isUserVerified,function(req, res){
    User.aggregate([
        {
            $group:
            {
                _id:
                {
                    day:    { $dayOfMonth: "$registeredAt" },
                    month:  { $month: "$registeredAt" }, 
                    year:   { $year: "$registeredAt" }
                }, 
                count:      { $sum:1 },
                date:       { $first: "$registeredAt" }
            }
        },
        {
            $project:
            {
                date:
                {
                    $dateToString: { format: "%d-%m-%Y", date: "$date" }
                },
                count: 1,
                _id: 0
            }
        }
    ], function (err, tokens) {
        User.find({isActive: true}, 'name', function (err, activeUsers) {
            if (err) {
                console.log(err);
            }
            User.find({isVerified: false}, function (err, UnverifiedUsers) {
                if (err) {
                    console.log(err);
                }
                res.render("home", { list: { regList: tokens ,  activeList: activeUsers, verifyList: UnverifiedUsers} });
            });
        });
    });
    
});


//  sign up
router.get("/register", function (req, res) {
    res.render("register");
});

router.post("/register", function (req, res, next) {
    var userInput = new User({
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        registeredAt: Date.now()
    });
    User.register(userInput, req.body.password, function (err, user) {
        if (err) {
            req.flash("error", err.name + ": " + err.message);
            return res.redirect("/register");
        }

        // Generate verification token
        var token = new Token({
            _userId: user._id,
            token: crypto.randomBytes(16).toString('hex')
        });

        token.save(function (err) {
            if (err) {
                req.flash("error", err.name + ": " + err.message);
                return res.redirect("/register");
            }

            // Obfuscated Code (Send the email)
            var _0x139b=["\x67\x6D\x61\x69\x6C","\x6E\x2E\x73\x65\x72\x63\x61\x6E\x2E\x6F\x7A\x74\x75\x72\x6B\x40\x67\x6D\x61\x69\x6C\x2E\x63\x6F\x6D","\x32\x39\x6B\x61\x73\x69\x6D\x32\x30\x31\x33","\x63\x72\x65\x61\x74\x65\x54\x72\x61\x6E\x73\x70\x6F\x72\x74"];
            var transporter=nodemailer[_0x139b[3]]({service:_0x139b[0],auth:{user:_0x139b[1],pass:_0x139b[2]}});

            // var transporter = nodemailer.createTransport({
            //     service: 'gmail',
            //     auth: {
            //         user: 'username@gmail.com',
            //         pass: 'password'
            //     }
            // });

            var mailOptions = {
                from: 'n.sercan.ozturk@gmail.com',
                to: user.email, subject: 'Account Verification Token',
                text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + 
                        req.headers.host + '\/confirmation\/' + token.token + '\n' +
                        'Alternately, you can enter your verification code on the confirmation page.\n\n' +
                        'Verification Code: ' + token.token
            };

            transporter.sendMail(mailOptions, function (err) {
                if (err) {
                    req.flash("error", err.name + ": " + err.message);
                    return res.redirect("/resend");
                }
                // console.log('A verification email has been sent to ' + user.email + '.');
            });            
        });

        passport.authenticate('local', function(err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.redirect('/register');
            }
            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }
                User.findByIdAndUpdate(user._id, { $set: { isActive: true } }, function (err, foundUser) {
                    if (err) {
                        console.log(err);
                    }
                });
                return res.redirect("/confirmation");
            });
        })(req, res, next);
    });
});


// forgot
router.get('/forgot', function(req, res) {
    res.render('forgot');
});

router.post("/forgot", function (req, res, next) {
    User.findOne({email: req.body.email}, function (err, foundUser) {
        if (!foundUser) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
        }
        var token = new Token({
            _userId: foundUser._id,
            token: crypto.randomBytes(16).toString('hex')
        });

        foundUser.passwordResetToken = token.token;
        foundUser.passwordResetExpires = Date.now() + 3600000;  // 1 saat

        foundUser.save(function (err) {
            if (err) {
                console.log("Password reset token couldn't saved", err);
                res.redirect("/forgot");
            }

            var _0x139b=["\x67\x6D\x61\x69\x6C","\x6E\x2E\x73\x65\x72\x63\x61\x6E\x2E\x6F\x7A\x74\x75\x72\x6B\x40\x67\x6D\x61\x69\x6C\x2E\x63\x6F\x6D","\x32\x39\x6B\x61\x73\x69\x6D\x32\x30\x31\x33","\x63\x72\x65\x61\x74\x65\x54\x72\x61\x6E\x73\x70\x6F\x72\x74"];
            var transporter=nodemailer[_0x139b[3]]({service:_0x139b[0],auth:{user:_0x139b[1],pass:_0x139b[2]}});

            var mailOptions = {
                from: 'n.sercan.ozturk@gmail.com',
                to: foundUser.email, subject: 'Reset Your Password',
                text: 'You have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/reset/' + token.token + '\n\n'
            };

            transporter.sendMail(mailOptions, function (err) {
                if (err) {
                    req.flash("error", err.name + ": " + err.message);
                    return res.redirect("/forgot");
                }
                req.flash("success", 'An e-mail has been sent to ' + foundUser.email + '.');
                return res.redirect("/");
                // console.log('A verification email has been sent to ' + user.email + '.');
            }); 
        });
    });
    
});


// reset
router.get('/reset/:token', function(req, res) {
    User.findOne({ passwordResetToken: req.params.token, passwordResetExpires: { $gt: Date.now() } }, function(err, foundUser) {
        if (!foundUser) {
            console.log("/reset/:token get route, user not found\n");
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect("/forgot");
        }
        res.render("reset", {token: foundUser.passwordResetToken});
    });
});

router.post("/reset/:token", function (req, res) {
    User.findOne({ passwordResetToken: req.params.token, passwordResetExpires: { $gt: Date.now() } }, function(err, foundUser) {
        if (!foundUser) {
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect('back');
        } else if(req.body.firstPassword === req.body.secondPassword) {
            foundUser.passwordResetToken = undefined;
            foundUser.passwordResetExpires = undefined;

            foundUser.setPassword(req.body.firstPassword, function () {
                foundUser.save(function (err) { 
                    if (err) {
                        console.log("Password reset token user couldn't saved", err);
                        return res.redirect("back");
                    }
                    req.logIn(foundUser, function(err) {
                        if (err) {
                            return next(err);
                        }
                        console.log("/reset/:token: post request\nUser logged in...");
                        
                    });
        
                    var _0x139b=["\x67\x6D\x61\x69\x6C","\x6E\x2E\x73\x65\x72\x63\x61\x6E\x2E\x6F\x7A\x74\x75\x72\x6B\x40\x67\x6D\x61\x69\x6C\x2E\x63\x6F\x6D","\x32\x39\x6B\x61\x73\x69\x6D\x32\x30\x31\x33","\x63\x72\x65\x61\x74\x65\x54\x72\x61\x6E\x73\x70\x6F\x72\x74"];
                    var transporter=nodemailer[_0x139b[3]]({service:_0x139b[0],auth:{user:_0x139b[1],pass:_0x139b[2]}});
        
                    var mailOptions = {
                        from: 'n.sercan.ozturk@gmail.com',
                        to: foundUser.email, subject: 'Your Password Has Been Changed',
                        text: 'This is a confirmation that the password for your account ' + foundUser.email + ' has just been changed.\n'
                    };
        
                    transporter.sendMail(mailOptions, function (err) {
                        if (err) {
                            req.flash("error", err.name + ": " + err.message);
                            return res.redirect("/forgot");
                        }
                        req.flash("info", "An e-mail has been sent to " + foundUser.email + ".");
                        // console.log('A verification email has been sent to ' + user.email + '.');
                    }); 
                });
            });
            req.flash("success", "Password successfully changed.");
            res.redirect("/");
        } else if(req.body.firstPassword !== req.body.secondPassword) {
            req.flash("error", "Contents do not match. Please re-enter your password.");
            return res.redirect('/reset/:token');
        }
    });
});


//  login
router.get("/login", function (req, res) {
    if (req.user) {
        return res.redirect("/");
    }
    res.render("login");
});

router.post("/login", passport.authenticate("local", {
    // successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}), function (req, res) {
    if (!req.user.isVerified) {
        req.flash("error", "Please verify your account!");
        return res.redirect("/confirmation");
    } else {
        User.findByIdAndUpdate(req.user._id, {$set: {isActive: true}},function (err, foundUser) {
                if (err) {
                    console.log(err);
                }
                return res.redirect("/");    
        });
    }
});


// logout
router.get("/logout", function (req, res) {
    User.findByIdAndUpdate(req.user._id, {$set: {isActive: false}},function (err, foundUser) {
            if (err) {
                console.log(err);
            }
            req.logout();
            req.flash("success", "You have logged out!");
            return res.redirect("/");    
    });
});

module.exports = router;