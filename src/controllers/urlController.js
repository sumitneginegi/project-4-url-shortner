const urlModel=require("../models/urlModel")
//const mongoose=require("mongoose")
const shortid = require('shortid');
const redis=require('redis')
const {promisify}=require('util')
//const { find } = require("../models/urlModel");
const urlRegex = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%.\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%\+.~#?&//=]*)/

//console.log(shortid.generate());



//========connect to Redis

const redisClient=redis.createClient(
    17158,
    "redis-17158.c17.us-east-1-4.ec2.cloud.redislabs.com",
    {no_ready_check:true}
);
redisClient.auth("f5sWRo37SPYE7xcFLP4XZF3yIKX5UhJV",
function(err){
    if(err)throw err;
})

redisClient.on_connect("connect",async function(){
    console.log("Connected to redis")
})

//========Connection setup for redis====usong SET and GET

const SETEX_ASYNC=promisify(redisClient.SETEX).bind(redisClient)
const GET_ASYNC=promisify(redisClient.GET).bind(redisClient)


//=======================================

module.exports = {
    urlShorten : async (req,res) => {
        try {
            let {longUrl} = req.body
            if (Object.keys(req.body).length < 1) return res.status(400).send({status: false,message: "please enter url"})
            if (!longUrl) return res.status(400).send({status: false,message: "longUrl is required"})
            if (typeof longUrl != "string") return res.status(400).send({status:false,message:"please enter url inside string"})
            if (! urlRegex.test(longUrl.trim())) return res.status(400).send({status:false,message:"please enter valid longUrl"})
           

            //====Getting Data from Cache 
            const cachedData=await GET_ASYNC(`${longUrl}`)
            if(cachedData){
                return res.status(200).send({status:true,message:"Data from Cache",data:JSON.parse(cachedData)})
            }

            //=============checking for duplicate longUrl
            let findUrl = await urlModel.findOne({longUrl:longUrl}).select({longUrl:1,shortUrl:1,urlCode:1,_id:0})
            if(findUrl){
                await SETEX_ASYNC(`${longUrl}`,20,JSON.stringify(longUrl))
                return res.status(200).send({status:true,message:"Data from db",data:findUrl})
                 }

            //if (findUrl) return res.status(400).send({status:false,message:"longUrl is already present"})

            let urlCode = shortid.generate().toLowerCase()
            if (findUrl) {
                urlCode = urlCode+shortid.generate()
            }
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

            //if (!urlCode) return res.status(400).send({status: false,message: "please enter url"})
           if (urlCode.length % 9 !=0) return res.status(400).send({status: false,message: "url code should be 9 or multiple of 9 characters only"})
            if (!shortid.isValid(urlCode)) return res.status(400).send({status: false,message: "please enter valid url"})
            
            let findUrl = await urlModel.findOne({urlCode:urlCode}).select({longUrl:1,_id:0})
            console.log(findUrl)
            if(!findUrl) return res.status(400).send({status:false,message:"url not found"})
            return res.status(302).redirect(findUrl.longUrl)
        } catch(error){
            return res.status(500).send({ status: false, error: error.message})
        }
    
    }

}