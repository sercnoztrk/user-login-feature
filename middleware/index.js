var middlewareObj   = {};

middlewareObj.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
};

middlewareObj.isUserVerified = function (req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.isVerified) {
            return next();
        }    
        req.flash("error", "Please verify your account first!");
        res.redirect("/confirmation");
    }
    return next();
};

module.exports = middlewareObj;