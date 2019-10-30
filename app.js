var express 			= require('express'),
	app     			= express(),
	bodyParser 			= require('body-parser'),
	mongoose   			= require('mongoose'),
	passport        	= require('passport'),
	LocalStrategy   	= require('passport-local'),
	flash    			= require('connect-flash'),
	session  			= require('express-session'),
	cookieParser 		= require('cookie-parser'),
	expressSanitizer	= require('express-sanitizer'),
	methodOverride  	= require('method-override'),
	User 				= require('./public/schema/userschema'),
	Doc					= require('./public/schema/docschema'),
	Medicine            = require('./public/schema/medschema'),
	Diag                = require('./public/schema/diagschema');

//APP CONFIG
mongoose.connect("mongodb://localhost/hms");
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(cookieParser('secret'));

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "VPC is the best!!",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next(); 
});

//ROUTES
app.get("/",function(req,res){
	res.render("landing");
});
app.get("/login/user",function(req,res){
	res.render("login");
});
app.get("/register/user",function(req,res){
	res.render("register");
});

//register
app.post("/register/user",function(req,res){ 
	
	    var newUser = new User({
			username:req.body.username,
			name:req.body.name,
			age:req.body.age,
			gender:req.body.gender,
			address:req.body.address,
			phone:req.body.phone
		});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register/user", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
           req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
           res.redirect("/login/user"); 
        });
    });
});

//login
app.post("/login/user",passport.authenticate("local",
	
	{
		successRedirect: "/landing/user",
		failureRedirect: "/login/user",
		failureFlash: true,
		successFlash: "Login Success!"
		
	}),function(req,res){
	
});

// logout route
app.get("/logout/user", function(req, res){
   req.logout();
   req.flash("success", "See you later!");
   res.redirect("/");
});


//Doctor 

//passport
// passport.use(new LocalStrategy(Doc.authenticate()));
// passport.serializeUser(Doc.serializeUser());
// passport.deserializeUser(Doc.deserializeUser());

// app.get("/login/doc",function(req,res){
// 	res.render("doclogin");
// });

// app.get("/register/doc",function(req,res){
// 	res.render("docregister");
// });


// //register
// app.post("/register/doc",function(req,res){ 
	
// 	    var newDoc = new Doc({
// 			username:req.body.username,
// 			name:req.body.name,
// 			age:req.body.age,
// 			gender:req.body.gender,
// 			experience:req.body.exp,
// 			Department:req.body.dep,
// 			address:req.body.address,
// 			phone:req.body.phone,
		
// 		});
//     Doc.register(newDoc, req.body.password, function(err, doc){
//         if(err){
//             console.log(err);
//             return res.render("docregister", {error: err.message});
//         }
//         passport.authenticate("local")(req, res, function(){
//            req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
//            res.redirect("/login/doc"); 
//         });
//     });
// });

// //login
// app.post("/login/doc",passport.authenticate("local",
	
// 	{
// 		successRedirect: "/landing/doc",
// 		failureRedirect: "/login/doc",
// 		failureFlash: true,
// 		successFlash: "Login Success!"
		
// 	}),function(req,res){
	
// });

// // logout route
// app.get("/logout/doc", function(req, res){
//    req.logout();
//    req.flash("success", "See you later!");
//    res.redirect("/");
// });


// app.get("/landing/doc",function(req,res){
// 	res.render("doclan");
// });

app.get("/landing/user",function(req,res){
	res.render("userlan");
});



//purchase
app.get("/purchase",function(req,res){
	  Medicine.find({}, function(err, allmedicines){
         if(err){
             console.log(err);
         } else {
              res.render("purchase",{medicines: allmedicines});
            }
      });

});

app.post("/purchase/:id",function(req,res){
	
	User.findById(req.user._id,function(err,user){
		
		if(err){
			console.log(err);
			res.redirect("/purchase");
		}else{
		
			Medicine.findById(req.params.id,function(err,foundMedicine){
				if(err){
					res.render("purchase");
				}else {
					console.log("posted!!");
					console.log(user);
					user.medicines.push(foundMedicine);
					user.save();
					res.redirect("/cart");
				}
			});
		}
	});
});

app.get("/cart",function(req,res){
	
		User.findById(req.user._id).populate("medicines").exec(function(err,user){
		if(err){
			console.log(err);
			res.redirect("/purchase");
		}else{
			res.render("cart",{user : user});
		}
	});
});

app.delete("/cart/:id",function(req,res){
		User.findById(req.user._id,function(err,user){
		
		if(err){
			console.log(err);
			res.redirect("/cart");
		}else{
		
			Medicine.findById(req.params.id,function(err,foundMedicine){
				if(err){
					res.render("purchase");
				}else {
					console.log("posted!!");
					console.log(user);
					user.medicines.pull(foundMedicine);
					user.save();
					res.redirect("/cart");
				}
			});
		}
	});
	
});

//CREATE ROUTE Medicine
app.post("/medicines",function(req,res){ 
	//create medicine
	req.body.Medicine.body = req.sanitize(req.body.Medicine.body);
	Medicine.create(req.body.Medicine,function(err,newMedicine){
		 if(err){
			 res.render("newmed");
		 }
		else{
			//then, redirect to index
			res.redirect("/medicines");
		}
	});
});

//EDIT ROUTE
app.get("/medicines/:id/edit",function(req,res){
	
	
	Medicine.findById(req.params.id,function(err,foundMedicine){
		if(err){
			res.redirect("/medicines");
		}else {
			res.render("editmes",{Medicine:foundMedicine});
		}
		
	})
	
});

//UPDATE ROUTE Medicine
app.put("/medicines/:id",function(req,res){
	req.body.Medicine.body = req.sanitize(req.body.Medicine.body);
	Medicine.findByIdAndUpdate(req.params.id,req.body.Medicine,function(err,updatedMedicine){
		if(err){
			res.redirect("/medicines");
		}else{
			res.redirect("/medicines");
		}
	})
});

//Delete route Medicine
app.delete("/medicines/:id",function(req,res){
	//destroy 
	Medicine.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/medicines");
		}else {
			//redirect somewhere
			res.redirect("/medicines");
		}
	})
	
});


//admin
app.get("/admin",function(req,res){
	res.render("admin");
});
app.get("/adminlanding",function(req,res){
	res.render("adminlanding");
});
app.get("/medicines/new",function(req,res){
	res.render("newmed");
});
app.get("/medicines",function(req,res){
	Medicine.find({}, function(err, allMedicines){
         if(err){
             console.log(err);
         } else {
              res.render("medlist.ejs",{medicines: allMedicines});
            }
      });
});

app.post("/admin",function(req,res){

	if(req.body.username=="poorna" && req.body.password=="123")
	{
		res.render("adminlanding.ejs");
	}
	else
	{
		res.render("admin.ejs");
	}
});
//admin patients list
app.get("/userslist",function(req,res){
	User.find({}, function(err, allusers){
         if(err){
             console.log(err);
         } else {
              res.render("userslist.ejs",{user: allusers});
            }
      });

});

//Delete Route patient
app.delete("/userslist/:id",function(req,res){

	User.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/userslist");
		}else {
			//redirect somewhere
			res.redirect("/userslist");
		}
	})
	
});

//admin doctors
app.get("/docs/new",function(req,res){
	res.render("newdoc");
});
app.get("/docs",function(req,res){
	Doc.find({}, function(err, allDocs){
         if(err){
             console.log(err);
         } else {
              res.render("doclist",{Docs: allDocs});
            }
      });
});


//CREATE ROUTE Doctor
app.post("/docs",function(req,res){ 
	//create doctors
	req.body.Doc.body = req.sanitize(req.body.Doc.body);
	Doc.create(req.body.Doc,function(err,newDoc){
		 if(err){
			 res.render("newdoc");
		 }
		else{
			//then, redirect to index
			res.redirect("/docs");
		}
	});
});

//SHOW ROUTE
app.get("/docs/:id",function(req,res){
	Doc.findById(req.params.id, function(err,foundDoc){
		if(err){
			res.redirect("/docs");
		}
		else{
			res.render("docshow",{Doc:foundDoc});
		}
	});
	
});


//EDIT ROUTE
app.get("/docs/:id/edit",function(req,res){
	
	Doc.findById(req.params.id,function(err,foundDoc){
		if(err){
			res.redirect("/docs");
		}else {
			res.render("editdocs",{Doc:foundDoc});
		}
		
	})
	
});

//UPDATE ROUTE Medicine
app.put("/docs/:id",function(req,res){
	req.body.Doc.body = req.sanitize(req.body.Doc.body);
	Doc.findByIdAndUpdate(req.params.id,req.body.Doc,function(err,updatedDoc){
		if(err){
			res.redirect("/docs");
		}else{
			res.redirect("/docs");
		}
	})
});

//Delete route Medicine
app.delete("/docs/:id",function(req,res){
	//destroy 
	Doc.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/docs");
		}else {
			//redirect somewhere
			res.redirect("/docs");
		}
	})
	
});

app.get("/docs/:id/addp",function(req,res){
		
	Doc.findById(req.params.id,function(err,foundDoc){
		if(err){
			res.redirect("/docs");
		}else {
			User.find({}, function(err, allUsers){
         	if(err){
             		console.log(err);
         	} else {
              	res.render("addpatient",{Doc:foundDoc,users:allUsers});
            }
      		});
		}
		
	});
});


app.post("/docs/:id1/:id2",function(req,res){
		User.findById(req.params.id1,function(err,user){
		if(err){
			console.log(err);
			res.redirect("/docs");
		}else{
		
			Doc.findById(req.params.id2,function(err,foundDoc){
				if(err){
					res.redirect("/docs");
				}else {
					console.log("posted!!");
					console.log(user);
					console.log(foundDoc);
					foundDoc.users.push(user);
					foundDoc.save();
					user.docs.push(foundDoc);
					user.save();
					res.redirect("/docs/"+req.params.id2);
				}
			});
		}
	});
});

app.get("/docs/:id/p",function(req,res){
	Doc.findById(req.params.id).populate("users").exec(function(err,doc){
		if(err){
			console.log(err);
			res.redirect("/docs");
		}else{
			res.render("docshowpat",{Doc : doc});
		}
	});
});

app.delete("/docs/:id1/:id2/p",function(req,res){
		Doc.findById(req.params.id2,function(err,Doc){
		
		if(err){
			console.log(err);
			res.redirect("/docs");
		}else{
			User.findById(req.params.id1,function(err,foundUser){
				if(err){
					res.redirect("/docs");
				}else {
					console.log("posted!!");
					console.log(foundUser);
					Doc.users.pull(foundUser);
					Doc.save();
					foundUser.docs.pull(Doc);
					foundUser.save();
					res.redirect("/docs/"+req.params.id2+"/p");
				}
			});
		}
	});
	
});

//showing doctors of patient
app.get("/users/docs",function(req,res){
		User.findById(req.user._id).populate("docs").exec(function(err,user){
		if(err){
			console.log(err);
			res.redirect("/landing/user");
		}else{
			res.render("userdoc",{user : user});
		}
	});
});

app.delete("/users/:id/docs",function(req,res){
	User.findById(req.user._id,function(err,user){
		if(err){
			console.log(err);
			res.redirect("/landing/user");
		}else{
		
			Doc.findById(req.params.id,function(err,foundDoc){
				if(err){
					res.redirect("/landing/user");
				}else {
					console.log("posted!!");
					console.log(user);
					console.log(foundDoc);
					user.docs.pull(foundDoc);
					user.save();
					foundDoc.users.pull(user);
					foundDoc.save();
					res.redirect("/users/docs");
				}
			});
		}
	});
});

app.get("/users/:id",function(req,res){
		Doc.findById(req.params.id, function(err,foundDoc){
		if(err){
			res.redirect("/landing/user");
		}
		else{
			res.render("userdocshow",{Doc:foundDoc});
		}
	});
});

//diagnosis reports
app.get("/diags/new",function(req,res){
	res.render("newdiag");
});
app.get("/diags",function(req,res){
	Diag.find({}, function(err, allDiags){
         if(err){
             console.log(err);
         } else {
              res.render("diaglist",{Diags: allDiags});
            }
      });
});


//CREATE ROUTE Doctor
app.post("/diags",function(req,res){ 
	//create doctors
	req.body.Diag.body = req.sanitize(req.body.Diag.body);
	Diag.create(req.body.Diag,function(err,newDiag){
		 if(err){
			 res.render("newdiag");
		 }
		else{
			//then, redirect to index
			res.redirect("/diags");
		}
	});
});

//SHOW ROUTE
app.get("/diags/:id",function(req,res){
	Diag.findById(req.params.id, function(err,foundDiag){
		if(err){
			res.redirect("/diags");
		}
		else{
			res.render("diagshow",{Diag:foundDiag});
		}
	});
	
});


//EDIT ROUTE
app.get("/diags/:id/edit",function(req,res){
	
	Diag.findById(req.params.id,function(err,foundDiag){
		if(err){
			res.redirect("/diags");
		}else {
			res.render("editdiags",{Diag:foundDiag});
		}
		
	})
	
});

//UPDATE ROUTE Medicine
app.put("/diags/:id",function(req,res){
	req.body.Diag.body = req.sanitize(req.body.Diag.body);
	Diag.findByIdAndUpdate(req.params.id,req.body.Diag,function(err,updatedDiag){
		if(err){
			res.redirect("/diags");
		}else{
			res.redirect("/diags");
		}
	})
});

//Delete route Medicine
app.delete("/diags/:id",function(req,res){
	//destroy 
	Diag.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/diags");
		}else {
			//redirect somewhere
			res.redirect("/diags");
		}
	})
	
});

//adding/deleting patients to diagnosis
app.get("/diags/:id/addp",function(req,res){
		
	Diag.findById(req.params.id,function(err,foundDiag){
		if(err){
			res.redirect("/diags");
		}else {
			User.find({}, function(err, allUsers){
         	if(err){
             		console.log(err);
         	} else {
              	res.render("addpatdiag",{Diag:foundDiag,users:allUsers});
            }
      		});
		}
		
	});
});


app.post("/diags/:id1/:id2",function(req,res){
		User.findById(req.params.id1,function(err,user){
		if(err){
			console.log(err);
			res.redirect("/diags");
		}else{
		
			Diag.findById(req.params.id2,function(err,foundDiag){
				if(err){
					res.redirect("/diags");
				}else {
					console.log("posted!!");
					console.log(user);
					console.log(foundDiag);
					foundDiag.users.push(user);
					foundDiag.save();
					user.docs.push(foundDiag);
					user.save();
					res.redirect("/diags/"+req.params.id2);
				}
			});
		}
	});
});

app.get("/diags/:id/p",function(req,res){
	Diag.findById(req.params.id).populate("users").exec(function(err,diag){
		if(err){
			console.log(err);
			res.redirect("/diags");
		}else{
			res.render("diagshowpat",{Diag : diag});
		}
	});
});

app.delete("/diags/:id1/:id2/p",function(req,res){
		Diag.findById(req.params.id2,function(err,Diag){
		
		if(err){
			console.log(err);
			res.redirect("/diags");
		}else{
			User.findById(req.params.id1,function(err,foundUser){
				if(err){
					res.redirect("/diags");
				}else {
					console.log("posted!!");
					console.log(foundUser);
					Diag.users.pull(foundUser);
					Diag.save();
					foundUser.docs.pull(Diag);
					foundUser.save();
					res.redirect("/diags/"+req.params.id2+"/p");
				}
			});
		}
	});
	
});

//showing doctors of patient
app.get("/users/diags",function(req,res){
		User.findById(req.user._id).populate("diags").exec(function(err,user){
		if(err){
			console.log(err);
			res.redirect("/landing/user");
		}else{
			res.render("userdiag",{user : user});
		}
	});
});

app.delete("/users/:id/docs",function(req,res){
	User.findById(req.user._id,function(err,user){
		if(err){
			console.log(err);
			res.redirect("/landing/user");
		}else{
		
			Doc.findById(req.params.id,function(err,foundDoc){
				if(err){
					res.redirect("/landing/user");
				}else {
					console.log("posted!!");
					console.log(user);
					console.log(foundDoc);
					user.docs.pull(foundDoc);
					user.save();
					foundDoc.users.pull(user);
					foundDoc.save();
					res.redirect("/users/docs");
				}
			});
		}
	});
});

app.get("/users/:id",function(req,res){
		Doc.findById(req.params.id, function(err,foundDoc){
		if(err){
			res.redirect("/landing/user");
		}
		else{
			res.render("userdocshow",{Doc:foundDoc});
		}
	});
});



app.listen(3000 || process.env.PORT,process.env.IP,function(req,res){
	console.log("SERVER IS STARTED!!");
});
	
	