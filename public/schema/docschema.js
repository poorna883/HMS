var mongoose=require("mongoose"),
passportLocalmongoose=require("passport-local-mongoose");
var DocSchema=new mongoose.Schema({
    name:String,
    age:Number,
    gender:String,
   	experience:String,
	department:String,
	designation:String,
	about:String,
	address:String,
    phone:String,
	users:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:"User"
		}
	]
});

DocSchema.plugin(passportLocalmongoose);
module.exports = mongoose.model("Doc",DocSchema);