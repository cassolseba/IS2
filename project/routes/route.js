var express = require('express');
var router = express.Router();
const pug = require('pug');
var test = require("./test");
var User = require("../model/user");
var Corso = require("../model/post");
var Review = require("../model/review");

router.get("/", function(req,res,next){
    isLoggedIn(req,res, function(logged) {
        console.log("logged"+logged);
        res.write(pug.renderFile("views/index.pug", {logged: logged}));
    });
});

//quando carica la prima volta la pagina di ricerca, non ci sono parametri
router.get("/cerco", function(req,res){
	res.write(pug.renderFile("views/cerco.pug", {values: []}));
});

//quando riceve una richiesta e ricarica la pagina con i risultati
router.post("/cerco", function(req,res){
	var subject = req.body.subject;
	//DA AGGIUNGERE geolocalizzazione, trasforma la location indicata nella form in longitudine e latitudine
	//var location = req.body.location;
	
	Corso.findPosts(subject, function (error, post) {
        if (error || post.length===0) {
            //non ci sono post con questa materia
            //DA AGGIUNGERE "nessun risultato per la ricerca"
			console.log("nessun risultato dalla query post");
			res.write(pug.renderFile("views/cerco.pug", {values: []}));
        } else {
			//console.log("query success: subject=" + subject + ", post=" + post);
			res.write(pug.renderFile("views/cerco.pug", {values: post}));
        }
		//DA AGGIUNGERE se ci sono post con la materia ma non nella zona, visualizza i più vicini
    });
});

router.get("/login", function(req,res){res.write(pug.renderFile("views/login.pug", {error: req.query.error}));res.end();});

router.get("/registrati", function(req,res){res.write(pug.renderFile("views/registration.pug"));});

router.get("/offro", function(req,res){res.write(pug.renderFile("views/offro.pug"));});

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

router.get("/annuncio", function(req,res){res.write(pug.renderFile("views/annuncio.pug", {recensioni : [], utente : new User}));});

router.post("/annuncio", function(req,res){
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
				res.write(pug.renderFile("views/annuncio.pug", {recensioni : [], utente : new User, anntxt : anntxt, ritorna : ritorna}));
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
						res.write(pug.renderFile("views/annuncio.pug", {recensioni : recensioni, utente : new User, anntxt : anntxt, ritorna : ritorna}));
					} else {
						//console.log("\nquery success: user=" + em);
						//var utente = em;
						//console.log("UTENTE TROVATO:" + em + "\n\n");
						res.write(pug.renderFile("views/annuncio.pug", {recensioni : recensioni, utente : em, anntxt : anntxt, ritorna : ritorna}));
						//res.write(pug.renderFile("views/annuncio.pug", {utente : em}));
					}
				});
			}
		});
	//}, 3000);
});

router.get("/addPost", function(req,res){res.write(pug.renderFile("views/addPost.pug"));});

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

module.exports = router;