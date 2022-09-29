const urlModel=require("../models/urlModel")
const mongoose=require("mongoose")
const shortid = require('shortid');
const urlRegex = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%.\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%\+.~#?&//=]*)/

//console.log(shortid.generate());

module.exports = {
    urlShorten : async (req,res) => {
        try {
            let {longUrl} = req.body
            if (Object.keys(req.body).length < 1) return res.status(400).send({status: false,message: "please enter url"})
            if (!longUrl) return res.status(400).send({status: false,message: "longUrl is required"})
            if (typeof longUrl != "string") return res.status(400).send({status:false,message:"please enter url inside string"})
            if (! urlRegex.test(longUrl.trim())) return res.status(400).send({status:false,message:"please enter valid longUrl"})

            let urlCode = shortid.generate()
            let shortUrl = `http://localhost:3000/${urlCode}`
            let data = {longUrl,shortUrl:shortUrl,urlCode:urlCode}

            await urlModel.create(data)
            return res.status(201).send({status: true,data: data})
        } catch (error) {
            return res.status(500).send({ status: false, error: error.message})
        }
    },

    getUrl : async (req, res) => {
        try{
            let urlCode = req.params.urlCode
            if(urlCode == ":urlCode") return res.status(400).send({status: false, message: "please enter urlCode in Params"})

            if (!urlCode) return res.status(400).send({status: false,message: "please enter url"})
            if (!shortid.isValid(urlCode) || urlCode.length != 9) return res.status(400).send({status: false,message: "please enter valid url"})

            let findUrl = await urlModel.findOne({urlCode:urlCode}).select({longUrl:1,_id:0})
            if(!findUrl) return res.status(400).send({status:false,message:"url not found"})
            return res.status(302).send({status: true, data: findUrl})
        } catch(error){
            return res.status(500).send({ status: false, error: error.message})
        }
    
    }
    
}