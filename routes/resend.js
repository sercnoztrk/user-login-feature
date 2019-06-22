var express     = require("express");
var router      = express.Router();
var middleware  = require("../middleware/index");
var crypto      = require("crypto");
var nodemailer  = require("nodemailer");
var User        = require("../models/user");
var Token       = require("../models/token");

router.post('/', middleware.isLoggedIn,function (req, res) {
    User.findById(req.user._id, function (err, foundUser) {
        if (err) {
            console.log("Resend post router", err);
            return res.redirect("back");
        } else if (foundUser.isVerified) {
            req.flash("info", "Account has already been verified.");
            return res.redirect("/");
        }
        
        var token = new Token({
            _userId: foundUser._id,
            token: crypto.randomBytes(16).toString('hex')
        });
        
        token.save(function (err) {
            if (err) {
                console.log("Resend post route", err);
                return res.redirect("back");
            }
            
            var _0x139b=["\x67\x6D\x61\x69\x6C","\x6E\x2E\x73\x65\x72\x63\x61\x6E\x2E\x6F\x7A\x74\x75\x72\x6B\x40\x67\x6D\x61\x69\x6C\x2E\x63\x6F\x6D","\x32\x39\x6B\x61\x73\x69\x6D\x32\x30\x31\x33","\x63\x72\x65\x61\x74\x65\x54\x72\x61\x6E\x73\x70\x6F\x72\x74"];
            var transporter=nodemailer[_0x139b[3]]({service:_0x139b[0],auth:{user:_0x139b[1],pass:_0x139b[2]}});

            var mailOptions = {
                from: 'n.sercan.ozturk@gmail.com',
                to: foundUser.email, subject: 'Account Verification Token',
                text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + 
                        req.headers.host + '\/confirmation\/' + token.token + '\n' +
                        'Alternately, you can enter your verification code on the confirmation page.\n\n' +
                        'Verification Code: ' + token.token
            };

            transporter.sendMail(mailOptions, function (err) {
                if (err) {
                    req.flash("error", err.name + ": " + err.message);
                    return res.redirect("/confirmation");
                }
                req.flash("info", "A verification mail has been sent to " + foundUser.email + ".");
                return res.redirect("/confirmation");
                // console.log('A verification email has been sent to ' + user.email + '.');
            }); 
        });
        
    });
});


module.exports = router;