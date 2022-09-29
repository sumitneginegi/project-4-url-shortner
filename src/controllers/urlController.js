const urlmodel=require("../models/urlModel")
const mongoose=require("mongoose")
const shortid = require('shortid');
//console.log(shortid.generate());

module.exports={
urlShorten : async (req,res)=>{
let {longurl}=req.body


 let a=shortid.generate();
console.log(a)

}}