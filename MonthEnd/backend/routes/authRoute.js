const express = require("express");
const { createdUser, loginUser } = require("../controller/auth");
const { googleLogin } = require("../controller/googleAuth");

const router = express.Router();

router.post("/google", googleLogin);

router.post("/signup", createdUser);
router.post("/login", loginUser);


module.exports = router;
