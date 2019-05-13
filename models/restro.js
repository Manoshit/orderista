var mongoose=require('mongoose');


var restroSchema= new mongoose.Schema({
	Email:String,
	name:String,
	api  : String, 
	address:String,
	phoneno: String ,
	cost : String ,
	type:String,
	link_image: String,
	is_menu_updated: Boolean

}) ;

module.exports = mongoose.model("restro",restroSchema); 