var mongoose=require('mongoose');


var historySchema= new mongoose.Schema({
	item:String,
	quantity:String,
	price  : String,
	res_name: String ,
	email:String


}) ;

module.exports = mongoose.model("history",historySchema); 