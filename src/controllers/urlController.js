// const urlModel=require("../models/urlModel")
// const shortid = require('shortid');
// const redis=require('redis')
// const {promisify}=require('util')
// const urlRegex = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%.\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%\+.~#?&//=]*)/





// //========connect to Redis

// const redisClient=redis.createClient(
//     17158,
//     "redis-17158.c17.us-east-1-4.ec2.cloud.redislabs.com",
//     {no_ready_check:true}
// );
// redisClient.auth("f5sWRo37SPYE7xcFLP4XZF3yIKX5UhJV",
// function(err){
//     if(err)throw err;
// })

// redisClient.on("connect",async function(){
//     console.log("Connected to redis")
// })

// //========Connection setup for redis====using SET and GET

// const SETEX_ASYNC=promisify(redisClient.SETEX).bind(redisClient)
// const GET_ASYNC=promisify(redisClient.GET).bind(redisClient)
// //const DEL_ASYNC=promisify(redisClient.DELETE).bind(redisClient)


// //=======================================

// module.exports = {
//     urlShorten : async (req,res) => {
//         try {
//             let {longUrl} = req.body
//             if (Object.keys(req.body).length < 1) return res.status(400).send({status: false,message: "please enter url"})
//             if (!longUrl) return res.status(400).send({status: false,message: "longUrl is required"})
//             if (typeof longUrl != "string") return res.status(400).send({status:false,message:"please enter url inside string"})
//             if (! urlRegex.test(longUrl.trim())) return res.status(400).send({status:false,message:"please enter valid longUrl"})
           

//             // //====Getting Data from Cache 
//             // const cachedData=await GET_ASYNC(`${longUrl}`)
//             // if(cachedData){
//             //     return res.status(200).send({status:true,message:"Data from Cache",data:JSON.parse(cachedData)})
//             // }

//             //=============checking for duplicate longUrl
//             let findUrl = await urlModel.findOne({longUrl:longUrl}).select({longUrl:1,shortUrl:1,urlCode:1,_id:0})
//             if(findUrl){
//                 await SETEX_ASYNC(`${longUrl}`,20,JSON.stringify(longUrl))
//                 return res.status(200).send({status:true,message:"Data from db",data:findUrl})
//                  }

//             //if (findUrl) return res.status(400).send({status:false,message:"longUrl is already present"})

//             let urlCode = shortid.generate().toLowerCase()
//             if (findUrl) {
//                 urlCode = urlCode+shortid.generate()
//             }
//             let shortUrl = `http://localhost:3000/${urlCode}`
//             let data = {longUrl,shortUrl:shortUrl,urlCode:urlCode}

//            // await urlModel.create(data)
//          //   return res.status(201).send({status: true,data: data})
//          await SETEX_ASYNC(`${longUrl}`,20,JSON.stringify(data))
//          return res.status(201).send({status:true,message:"Data Created",data:data})
//         } catch (error) {
//             return res.status(500).send({ status: false, error: error.message})
//         }
//     },

//     getUrl : async (req, res) => {
//         try{
//             let urlCode = req.params.urlCode

//             //if (!urlCode) return res.status(400).send({status: false,message: "please enter url"})
//            if (urlCode.length % 9 !=0) return res.status(400).send({status: false,message: "url code should be 9 or multiple of 9 characters only"})
//             if (!shortid.isValid(urlCode)) return res.status(400).send({status: false,message: "please enter valid url"})
            
//             // let findUrl = await urlModel.findOne({urlCode:urlCode}).select({longUrl:1,_id:0})
//             // console.log(findUrl)
//             // if(!findUrl) return res.status(400).send({status:false,message:"url not found"})
//             // return res.status(302).redirect(findUrl.longUrl)
//             let cachedURLCode = await GET_ASYNC(`${req.params.urlCode}`)
//             if(cachedURLCode){
//                 return res.status(302).redirect(cachedURLCode)
//             } else{
//                 const cachedData = await urlModel.findOne({urlCode : urlCode})
//                 if(!cachedData){
//                     return res.status(404).send({status: false, message: "URL Not Found"})
//                 }
//                 await SETEX_ASYNC(`${req.params.urlCode}`, 20, (cachedData.longUrl))
//                 return res.status(302).redirect(cachedData.longUrl)
//             }
    
//         } catch(error){
//             return res.status(500).send({ status: false, error: error.message})
//         }
    
//     }

// }

const UrlModel = require("../models/urlModel")
const shortid = require('shortid')
let validUrl = require('valid-url');
const baseUrl = 'http://localhost:3000'
const redis = require("redis");
const { promisify } = require("util");

//Connect to redis

const redisClient = redis.createClient(
    17158,
    "redis-17158.c17.us-east-1-4.ec2.cloud.redislabs.com",
    { no_ready_check: true }
    );
    redisClient.auth("f5sWRo37SPYE7xcFLP4XZF3yIKX5UhJV", function (err) {
    if (err) throw err;
    });
    
    redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
    });
    
    //Connection setup for redis
    
    const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
    const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const isValidAdd = function (value) {
    if (typeof value == "undefined" || value === null || typeof value === "boolean" || typeof value === "number") return false
    if (typeof value == "string" && value.trim().length == 0) return false
    return true
}

const creatUrl = async function (req, res) {
    try {
        // let data = req.body
        // let longUrl = data.url
        let {longUrl} = req.body

        if (!isValidAdd(longUrl)) {
            return res.status(400).send({ status: false, message: "please provide data in body" })
        }
        if (!longUrl) {
            return res.status(400).send({ status: false, message: "Url is mandatory" })
        }

        if (!validUrl.isUri(longUrl)) {
            return res.status(400).send({ status: false, message: "invalid long URL" })
        }
        const urlCode = shortid.generate().toLowerCase()
        //Locale
        let url = await UrlModel.findOne({ longUrl }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })
        console.log(url)
        if (url) {
            return res.status(200).send({ status: true,msg:"Data from db", data: url })
        }

        const shortUrl = baseUrl + '/' + urlCode

        url = new UrlModel({ longUrl, shortUrl, urlCode })
        await url.save()
        let obj = await UrlModel.findOne({ longUrl }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })
        res.status(200).send({ status: true,msg:"data newly created", data: obj })

    } catch (err) {
        res.status(500).send({ status: false, message: err })
    }
}

const getUrl = async function (req, res) {
    try {

        let casheData = await GET_ASYNC(`${req.params.urlCode}`);

        if (casheData) return res.status(302).redirect(casheData);
    
        const findURL = await UrlModel.findOne({ urlCode: req.params.urlCode });

        if(findURL){
      //  await SET_ASYNC(`${req.params.urlCode}`, findURL.longUrl);
      await SET_ASYNC(`${req.params.urlCode}`, findURL.longUrl,'EX',60);// likho
        return res.status(302).redirect(findURL.longUrl);
        }
        
        return res.status(404).send({ status: false, message: "url not found" })

    }
    catch (err) {
        res.status(500).send({ status: false, message: err })
    }
}


module.exports = { creatUrl, getUrl }