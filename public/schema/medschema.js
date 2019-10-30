var mongoose=require("mongoose");

var MedSchema=new mongoose.Schema({

    name:String,
    batchno:String,
    mfd:String,
    exp:String,
    price:Number

});


module.exports = mongoose.model("Medicine",MedSchema);