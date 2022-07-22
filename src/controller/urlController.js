const urlModel = require("../models/urlModel");
const shortid = require('shortid')
const validUrl = require('valid-url')
const redis = require('redis')
const { promisify } = require("util");


//Connect to redis
const redisClient = redis.createClient(
  13190,
  "redis-13190.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("gkiOIPkytPI3ADi14jHMSWkZEo2J5TDG", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});
 
//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

// Create Url

const createUrl = async function (req, res) {
  try {
    const longUrl = req.body.longUrl

    if(Object.keys(req.body).length == 0){
      return res.status(400).send({status:false, message:"Body should not be Empty."})
    }

    if (!longUrl || typeof longUrl != "string" || longUrl.trim().length == 0){
        return res.status(400).send({status:false, message:"LongUrl must be present and Typeof must be String."})
    }
  
    if (!validUrl.isUri(longUrl)){
      return res.status(400).send({status:false, message:"URL incorect"})
    }

    let data =await urlModel.findOne({longUrl}).select({_id:0,longUrl:1,shortUrl:1,urlCode:1})
    if(data){
      return res.status(201).send({status:true, message: "success",data:data})
    }

    const str = 'http://localhost:3000/'
    const urlCode = shortid.generate().toLowerCase()

    const shortUrl = str + urlCode

    const savedData = await urlModel.create({longUrl, shortUrl, urlCode})

    await SET_ASYNC(`${longUrl, shortUrl, urlCode}`, JSON.stringify(savedData))

   let obj = {
    longUrl: savedData.longUrl,
    shortUrl: savedData.shortUrl,
    urlCode: savedData.urlCode
}

    return res.status(201).send({ status: true, message: "success", data: obj })

  }
  catch (err) {
    return res.status(500).send({ status: false, message: err.message })
  }
}

module.exports.createUrl = createUrl

// Get Url

const getUrl = async function (req, res) {
    try {
        
      const urlCode = req.params.urlCode

      if (!shortid.isValid(urlCode)){
         return res.status(400).send({ status: false, message: "invalid urlCode" })
        } 
       
      let cahcedProfileData = await GET_ASYNC(`${urlCode}`)

      if(cahcedProfileData) {
         res.send(cahcedProfileData)
       } else {

      const getUrl  = await urlModel.findOne({ urlCode });

      if (!getUrl) { return res.status(404).send({ status: false, message: "urlCode not found" })}
  
      await SET_ASYNC(`${urlCode}`, JSON.stringify(getUrl))
  
      return res.status(302).send("Rediect to" + getUrl.longUrl )
    
      }
    }
    catch (err) { 
      return res.status(500).send({ status: false, message: err.message })
    }
  }
  

  module.exports.getUrl = getUrl

  