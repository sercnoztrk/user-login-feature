var express = require("express");
var router  = express.Router();
var middleware = require("../middleware/index");
var Token   = require("../models/token");
var User    = require("../models/user");

// Verification page
router.get("/", middleware.isLoggedIn, function (req, res) {
    if (!req.user.isVerified) {
        return res.render("confirmation");
    } else {
        req.flash("success", "Account has already been verified.");
        return res.redirect("back");
    }
});

// Token entered verification
router.post("/", middleware.isLoggedIn,function (req, res, next) {
    Token.findOne({token: req.body.code, _userId: req.user._id}, function (err, token) {
        if (err) {
            console.log(err);
            return res.redirect("back");
        } else if (!token) {
            console.log("Token not found where requesting confirmation post!");
            return res.redirect("back");
        } else {
            User.findByIdAndUpdate(req.user._id, {$set: {isVerified: true}}, function (err, updatedUser) {
                if (err) {
                    console.log(err);
                    return res.redirect("back");
                } else {
                    req.flash("success", "Account successfully verified.");
                    return res.redirect("/");
                }
            });
        }
    });
});

// Token link verification
router.get("/:token", function (req, res) {
    Token.findOne({token: req.params.token}, function (err, token) {
        if (err) {
            console.log(err);
        } else if (!token) {
            req.flash("error", "User is not registered or verification code expired.");
            return res.redirect("back");
        }
        User.findById(token._userId, function (err, user) {
            if (err) {
                console.log(err);
                return res.redirect("back");
            } else if (!user) {
                console.log("\User not found!..");
                req.flash("error", "No user is found related to this code.");
                return res.redirect("back");
            } else if (user.isVerified) {
                req.flash("error", "Account has already been verified.");
                return res.redirect("back");
            }

            user.isVerified = true;
            user.save(function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("back");
                } else {
                    req.flash("success", "Account successfully verified.");
                    return res.redirect("/");
                }
            });
        });
    })
});


module.exports = router;