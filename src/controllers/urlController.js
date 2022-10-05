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