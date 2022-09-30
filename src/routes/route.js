const express = require("express")
const router = express.Router()
const {urlShorten,getUrl} = require("../controllers/urlController")


router.post("/url/shorten",urlShorten)
router.get("/:urlCode",getUrl)
//router.all("/*",(req,res)=>{return res.status(400).send({status:false,msg:"end point is not valid"})})

module.exports=router
