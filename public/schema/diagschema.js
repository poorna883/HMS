var mongoose=require("mongoose");

var DiagSchema=new mongoose.Schema({

    name:String,
	details: String,
	remark: String,
	date: String,
	other: String,
   	users:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:"User"
		}
	]

});


module.exports = mongoose.model("Diag",DiagSchema);