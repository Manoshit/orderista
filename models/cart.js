var mongoose=require('mongoose');


var cartSchema= new mongoose.Schema({
	item:String,
	quantity:String,
	price  : String,
	res_name: String ,
	long:String,
	lat: String,
	email:String


}) ;

module.exports = mongoose.model("cart",cartSchema); 