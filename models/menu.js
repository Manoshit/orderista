var mongoose=require('mongoose');


var menuSchema= new mongoose.Schema({
	item:String,
	type:String,
	category: String ,
	price:String,

	

}) ;

module.exports = mongoose.model("menu",menuSchema); 