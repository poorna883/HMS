var mongoose=require("mongoose"),
passportLocalmongoose=require("passport-local-mongoose");
var UserSchema=new mongoose.Schema({
    username:String,
    password:String,
    name:String,
    age:Number,
    gender:String,
    address:String,
    phone:String,
	medicines:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:"Medicine"
		}
	],


});

UserSchema.plugin(passportLocalmongoose);
module.exports = mongoose.model("User",UserSchema);