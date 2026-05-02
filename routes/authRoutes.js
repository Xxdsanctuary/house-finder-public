const express = require("express");
const router = express.Router();

const accountController = require("../controllers/accountController");

router.get("/register", accountController.registerGet);

router.post("/register", accountController.registerPost);

router.get("/login", accountController.loginGet);

router.post("/login", accountController.loginPost);

router.get("/logout", accountController.logout);

module.exports = router;
