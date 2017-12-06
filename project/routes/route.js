var express = require('express');
var router = express.Router();
const pug = require('pug');
var test = require("./test");
var User = require("../model/user");
var Corso = require("../model/post");
var Review = require("../model/review");
var path = require('path'), fs = require('fs');
var formidable = require('formidable');
//var bodyparser = require('body-parser');

router.get("/", function(req,res,next){
    isLoggedIn(req,res, function(logged) {
        console.log("logged"+logged);
        res.write(pug.renderFile("views/index.pug", {logged: logged}));
    });
});

//quando carica la prima volta la pagina di ricerca, non ci sono parametri
router.get("/cerco", function(req,res){
    isLoggedIn(req,res, function(logged) {       
        res.write(pug.renderFile("views/cerco.pug", {values: [], logged: logged}));
    });
});

//quando riceve una richiesta e ricarica la pagina con i risultati
router.post("/cerco", function(req,res){
    isLoggedIn(req,res, function(logged) {        
        var subject = req.body.subject;
        //DA AGGIUNGERE geolocalizzazione, trasforma la location indicata nella form in longitudine e latitudine
        //var location = req.body.location;
        
        Corso.findPosts(subject, function (error, post) {
            if (error || post.length===0) {
                //non ci sono post con questa materia
                //DA AGGIUNGERE "nessun risultato per la ricerca"
                console.log("nessun risultato dalla query");
                res.write(pug.renderFile("views/cerco.pug", {values: [], logged: logged}));
            } else {
                console.log("query success: subject=" + subject + ", post=" + post);
                res.write(pug.renderFile("views/cerco.pug", {values: post, logged: logged}));
            }
            //DA AGGIUNGERE se ci sono post con la materia ma non nella zona, visualizza i più vicini
        });
    });
});

router.get("/login", function(req,res){
    isLoggedIn(req,res, function(logged) {        
        res.write(pug.renderFile("views/login.pug", {error: req.query.error, logged: logged}));res.end();
    });
});

router.get("/registrati", function(req,res){
    isLoggedIn(req,res, function(logged) {        
        res.write(pug.renderFile("views/registration.pug", {logged: logged}));
    });
});

router.get("/offro", function(req,res){
    isLoggedIn(req,res, function(logged) {        
        res.write(pug.renderFile("views/offro.pug", {logged: logged}));
    });
});

router.post("/ritorna", function(req,res){
	var subject = req.body.subject;
	
	Corso.findPosts(subject, function (error, post) {
        if (error || post.length===0) {
			res.write(pug.renderFile("views/cerco.pug", {values: []}));
        } else {
			res.write(pug.renderFile("views/cerco.pug", {values: post}));
        }
    });
});
router.post("/offro", function(req,res){
    isLoggedIn(req,res, function(logged) {
        var postData = {
            email: req.body.email,
            subject: req.body.subject,
            text: req.body.text         
        }
        Corso.create(postData, function (error, user) {
            if (error) {
                return next(error);
            }
            else {
                console.log("post creato!");
                return res.redirect('/test/successfullyRegistered');
            }
        });   
        //res.write(pug.renderFile("views/offro.pug"));
    });
});

router.get("/annuncio", function(req,res){
    isLoggedIn(req,res, function(logged) {        
        res.write(pug.renderFile("views/annuncio.pug", {logged: logged}));
    });
});

router.post("/annuncio", function(req,res){
      isLoggedIn(req,res,function(logged){
	var user = req.body.utente;
	var anntxt = req.body.anntxt;
	var ritorna = req.body.ritorna;
	//console.log("UTENTE PASSATO ALLA QUERY: " + user + "\n\n");
	var recensioni = [];
	
	//setTimeout( function() {
		Review.findReviewOf(user, function(error, rs) {
			if (error || rs.length===0) {
				console.log("\nnessun risultato dalla query recensioni");
				//recensioni.push("nessun risultato dalla query");
				res.write(pug.renderFile("views/annuncio.pug", {recensioni : [], utente : new User, anntxt : anntxt, ritorna : ritorna, media : 0, numero : 0, logged:logged}));
				//res.write(pug.renderFile("views/annuncio.pug", {recensioni : recensioni}));
			} else {
				//console.log("\nquery success: email=" + user + ", utente=" + em);
				//console.log("\n++++++++++++++\n");
				for (var i=0; i<rs.length; i++) {
					recensioni.push(rs[i]);
					//console.log("elemento: " + recensioni[i] + ", aggiunto\n");	
				}
				
				//console.log("\n++++++++++++++\n");
				User.findByEmail(user, function(error, em) {
					if (error || !em) {
						console.log("\nnessun risultato dalla query utenti");
						//res.write(pug.renderFile("views/annuncio.pug", {utente: "utente sconosciuto"}));
						//var utente = "utente sconosciuto";
						//console.log("UTENTE NON TROVATO\n\n");
						res.write(pug.renderFile("views/annuncio.pug", {recensioni : recensioni, utente : new User, anntxt : anntxt, ritorna : ritorna, media : 0, numero : 0, logged:logged}));
					} else {
						//console.log("\nquery success: user=" + em);
						//var utente = em;
						//console.log("UTENTE TROVATO:" + em + "\n\n");
						
						Review.avg(user, function(error, media) {
							if (error) {
								console.log(error);
								res.write(pug.renderFile("views/annuncio.pug", {recensioni : recensioni, utente : em, anntxt : anntxt, ritorna : ritorna, media : 0, numero : 0, logged:logged}));
							} else {
								var sum = 0;
								var count = media.length;
								for(var i=0; i<media.length; i++) {
									sum += media[i].vote;
								}
								
								res.write(pug.renderFile("views/annuncio.pug", {recensioni : recensioni, utente : em, anntxt : anntxt, ritorna : ritorna, media : sum/count, numero : media.length, logged:logged}));
							}
						})
						
						
						//res.write(pug.renderFile("views/annuncio.pug", {utente : em}));
						
					}
					//res.end();
				});
			}
		});
	//}, 3000);
      });
});

router.get("/addPost", function(req,res){
    isLoggedIn(req,res, function(logged) {        
        res.write(pug.renderFile("views/addPost.pug", {logged: logged}));
    });
});

router.use("/test", test);

function isLoggedIn(req, res, callback) {
    User.findById(req.session.userId)
    .exec(function (error, user) {
        if (error) {
            return callback(false);
        } 
        else {
            if (user === null) {
                return callback(false);
            }
            else {
                return callback(true);
            }
        }
    });
}

//router.use(bodyparser({uploadDir:'../'}));
router.post('/upload', function (req, res) {
    
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) 
        {
            var oldpath = files.file_upload.path;
            var newpath = __dirname + '/../upload/' + files.file_upload.name;
            fs.rename(oldpath, newpath, function (err) 
            {
                if (err) throw err;                
                res.redirect("/test/account");                        
            });
        });
    
});
module.exports = router;