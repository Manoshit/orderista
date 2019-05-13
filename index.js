var express = require('express');
var bodyParser = require('body-parser');
var path= require('path');
var flash = require('connect-flash');
var mongoose=require('mongoose');
var passport=require('passport');
var localstrategy=require('passport-local');
var User = require("./models/user");
var restro = require("./models/restro");
var menu = require("./models/menu");
var cart =require("./models/cart");
var expressValidator = require('express-validator');
const session = require('express-session');
var nodemailer = require('nodemailer');
var merge  = require('lodash.merge');
var mergeWith = require('lodash.mergewith');
var _ = require('lodash');
var signup_mailer = require('./mailer.js');
var contact_mailer = require('./contact_mailer');
var checksum = require("./paytm/models/checksum.js");
var config = require('./paytm/config/config.js');
var app = express()

//flash middleware

app.use(flash());

//view engine
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

// set static path
app.use(express.static(path.join(__dirname,'public')));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());


app.use(expressValidator());

app.use(session({secret: 'krunal', saveUninitialized: false, resave: false}));

// passport setup
app.use(passport.initialize());
app.use(passport.session());



passport.serializeUser(User.serializeUser());

passport.deserializeUser(User.deserializeUser());


// passport local authentication

passport.use(new localstrategy(User.authenticate()));
// mongoose connection
mongoose.connect("mongodb://manu:Shambar123@ds041563.mlab.com:41563/order");

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error: '));

//Show that our db is succesfully Connected
db.once('open', function(){
	console.log("Connected to Mongo Lab: ");
})

function isloggedin(req,res,next){

	if(req.isAuthenticated()){
		return next();
	}
	else
		res.redirect('/login');
}

app.use(function(req,res,next){



	res.locals.currentuser = req.user;
	res.locals.success=req.flash("success");
	res.locals.error=req.flash("error");


	next();

});

/*** NODEMAILER ***/


/**** GET ROUTES ****/

app.get('/',function(req,res){
	var curr = req.user;
	res.render('home');
});
app.get('/conatct',function(req,res)
{
	res.render('contact');
});
app.get('/register', isloggedin ,function(req,res)
{
	res.render('register');
});

app.get('/signup',function(req,res)
{
	res.render('signup' , {});

});

app.get('/login',function(req,res){

	res.render('login');
});



app.get('/logout',function(req,res){

	req.logout();
	req.flash("success" , "Successfully logged out");
	res.redirect('/');
});

app.get('/profile',function(req,res) {

	db.collection("restro").find({Email:req.user.username}, { projection: { _id: 0, name: 1, city:1 ,state : 1, address : 1 , phoneno : 1 }}).toArray(function(err, result) {
		if (err) throw err;
		console.log(result);
		var resname = result[0].name;
		var city = result[0].city;
		var state = result[0].state;
		var address = result[0].address;
		var phoneno = result[0].phoneno;
		res.render('profile', {rest:resname ,city:city , state:state, address:address, phoneno:phoneno});

	});


});

app.get('/add',function(req,res) {
	res.render('add');


});


app.get('/landing',function(req,res){

	db.collection("restro").find({}, { projection: { _id:1 , link_image : 1, Email: 1, name: 1, city : 1, state : 1, pin :1, address :1 , phoneno:1, cost:1, type:1 }}).toArray(function(err, result) {
		if (err) throw err;

		var results = result;


		res.render('landing', {resultant:results});

	});

})	;

app.get('/update',function(req,res){
	

	db.collection("restro").find({Email:req.user.username}, { projection: { _id:0, name: 1,is_menu_updated:1 }}).toArray(function(err, result) {
		res_name=result[0].name;
		up = result[0].is_menu_updated;

		db.collection("menu").find({res_name:res_name}).toArray(function(err,result){
			


			res.render('update',{result:result});
		});
	
		
	
});


});



app.get('/landing/:id',function(req,res){
	db.collection("restro").find({"_id":mongoose.Types.ObjectId(req.params.id)}).toArray(function(err , found){
		if(err)
		{
			console.log(err);
		}
		else{
			db.collection("menu").find({res_name:found[0].name},{projection:{_id:0,category:1}}).toArray(function(err,fcategory){
				if(err)
				{
					console.log(err);
				}


				function getUnique(arr, comp) {

					const unique = arr
					.map(e => e[comp])

     // store the keys of the unique objects
     .map((e, i, final) => final.indexOf(e) === i && i)

    // eliminate the dead keys & store unique objects
    .filter(e => arr[e]).map(e => arr[e]);

    return unique;
}

ucategory=getUnique(fcategory,'category')
db.collection("update").find({res_name:found[0].name},{projection:{_id:0}}).toArray(function(err,updated){
	
	

	res.render('show',{found,ucategory,updated});

});
});

		}

	});
})

app.get('/cart',function(req,res){
	db.collection("cart").find({email:req.user.username},{projection:{_id:0}}).toArray(function(err,result){
	
var sum = 0;
		if(result.length>0){

		for(var i = 0 ; i < result.length; i++){
			sum = sum + (result[i].price * result[i].quantity);
		}


		
			res.render('cart',{result:result,sum:sum});

		}
else{
	res.send("Your Cart is empty");
}

	})
});

app.get('/pgredirect', function(req,res){
        console.log("in pgdirect");
        res.render('pgredirect.ejs');
    });
 app.get('/testtxn', function(req,res){
         res.render('testtxn.ejs',{'config' : config});
     });

/***** END OF GET ROUTES ***/

app.post('/contact', (req,res)=>{
	var name = req.body.name;
	var email = req.body.email;
	var subject = req.body.subject;
	contact_mailer(name,email,subject);
	res.redirect('/conatct');
});

app.post('/signup', function(req,res)
{
	var name = req.body.name;
	var username = req.body.username;
	var password = req.body.password;

	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('username', 'email is required').notEmpty();
	req.checkBody('password', 'password is required').notEmpty();

	var errors = req.validationErrors();

	if(errors){
		req.session.errors = errors;
		req.session.success = false;
		console.log(errors);
		req.flash("error" , errors.msg);

		res.redirect('/signup');
	}
	else{
		req.session.success = true;


		var newuser = new User({name:req.body.name, username:req.body.username, isAdmin:"false"});

		User.register(newuser,req.body.password, function(err,user){

			if(err){
				console.log(err);
				req.flash("error" , err.message);
				return res.redirect('/signup');
			} 

			signup_mailer(username,name);
			req.flash("success" ,"Successfully Signed up");
			res.redirect('/'); 	
		});




	}

});

app.post('/login',passport.authenticate("local",{
	successRedirect:"/" ,
	failureRedirect:"/login",
	failureFlash: true
}),function(req,res){

});




app.post('/addrestro',function(req,res){

	var user_email = req.user.username;
	var myquery = { username: user_email };
	var newvalues = { $set: {isAdmin: "true" } };
	User.updateOne(myquery, newvalues, function(err, res) {
		if (err) throw err;
		console.log("1 document updated");
	});
   var obj ={Email:req.body.Email,name:req.body.name,api:req.body.api,address:req.body.address,type:req.body.type,phoneno:req.body.phoneno,cost:req.body.cost,link_image:req.body.link_image,is_menu_updated:"false",lat:req.body.profile_lat,long:req.body.profile_lng};
	db.collection("restro").insertOne(obj,function(err){

		if(err)
		{
			console.log(err);
		}

		res.redirect('/');
	});





});

app.post('/add',function(req,res){
	var res_name;

	db.collection("restro").find({Email:req.user.username}, { projection: { _id:0, name: 1 }}).toArray(function(err, result) {
		res_name=result[0].name;

		var obj ={item:req.body.item,price:req.body.price,category:req.body.category,res_name:res_name,type:req.body.type};

		var value=req.body.item;
		db.collection("menu").find({res_name:res_name}).toArray(function(err , result){
			if(result.length==0){

				db.collection("menu").insertOne(obj,function(err)
				{
					console.log("1"); 		
					console.log(err);
					req.flash("success" , "Item Added . After adding all the items update your Menu");
					res.redirect('/add');
				});	
			}


			else{
				db.collection("menu").find({item:value,res_name:res_name}).toArray(function(err,result){
					console.log(result);
					if(result.length>0){
						console.log("2");
						req.flash("error","Item Has Already Been Added");              
						res.redirect('/add');
					}
					else
					{
						db.collection("menu").insertOne(obj,function(err)
						{
							console.log("3");
							console.log(err);
							req.flash("success" , "Item Added . After adding all the items update your Menu");
							res.redirect('/add');


						});

					}
				});
			}
			


		});
	});

});
app.post('/update',function(req,res){
 

	var resname;

	db.collection("restro").find({Email:req.user.username}, { projection: { _id:0, name: 1 }}).toArray(function(err, result) {
		resname = result[0].name;
		
		var myquery = { res_name: resname };
		var newvalues = { $set: {item:req.body.item,price:req.body.price,category:req.body.category,res_name:resname,type:req.body.type} };
		db.collection("update").update(myquery,newvalues,{upsert:true},function(err,res){
			console.log(err);
		});
	});

	req.flash("success" ,"MENU UPDATED");

	res.redirect('/update');
});



app.post('/request', function (req, res) {
db.collection("restro").find({Email:req.user.username}, { projection: { _id:0, name: 1 }}).toArray(function(err, result) {
		resname = result[0].name;
     var myquery = { "item": req.body.status , "res_name":resname};
     console.log(req.body.status);
  db.collection("menu").deleteOne(myquery, function(err, obj) {
    if (err) throw err;
    console.log("1 document deleted");
  });
});
	console.log("Document Delete hiogya"); 
});



app.post('/cart',function(req,res){


	var obj ={item:req.body.item,quantity:req.body.value,price:req.body.price,lat:req.body.lat,long:req.body.long,res_name:req.body.res_name,email:req.user.username};
	db.collection("cart").find({item:req.body.item},{projection:{_id:0,item:1}}).toArray(function(err,result){
		if(result.length>0){
myquery= {item:req.body.item};
newvalues={item:req.body.item,quantity:req.body.value,price:req.body.price,lat:req.body.lat,long:req.body.long,res_name:req.body.res_name,email:req.user.username};
db.collection("cart").update(myquery,newvalues,function(err,res){
console.log(err);
});
		}
else{

	db.collection("cart").insertOne(obj,function(err){
		if(err)
		{
			console.log(err);
		}
	});
	}
});


});

app.post('/response', function(req,res){
    console.log("in response post");
    var paramlist = req.body;
        var paramarray = new Array();
        console.log(paramlist);
        if(checksum.verifychecksum(paramlist, config.PAYTM_MERCHANT_KEY))
        {
            console.log("true");
            res.render('response.ejs',{ 'restdata' : "true" ,'paramlist' : paramlist});
        }else        {
            console.log("false");
            res.render('response.ejs',{ 'restdata' : "false" , 'paramlist' : paramlist});
        };
    });


     app.post('/testtxn',function(req, res) {
        console.log("POST Order start");
        var paramlist = req.body;
        var paramarray = new Array();
        console.log(paramlist);
        for (name in paramlist)
        {
            if (name == 'PAYTM_MERCHANT_KEY') {
               var PAYTM_MERCHANT_KEY = paramlist[name] ;
            }else{
                paramarray[name] = paramlist[name] ;
            }
        }
        console.log(paramarray);
        paramarray['CALLBACK_URL'] = 'http://localhost:3000/response';  // in case if you want to send callback        console.log(PAYTM_MERCHANT_KEY);
        checksum.genchecksum(paramarray, PAYTM_MERCHANT_KEY, function (err, result)
        {
            console.log(result);
            res.render('pgredirect.ejs',{ 'restdata' : result });
        });
        console.log("POST Order end");
     });



var port = process.env.PORT || 3000
app.listen(port, function() {
	console.log("App is running on port " + port);
});





