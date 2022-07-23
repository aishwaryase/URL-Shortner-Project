const express = require("express");
const router = express.Router(); 
const urlController = require("../controller/urlController")


router.post("/url/shorten",urlController.createUrl)

router.get("/:urlCode",urlController.getUrlCode)
router.all("/*", function(req, res){
    res.status(404).send({status:false, message: "URL not found"})
})
module.exports = router;