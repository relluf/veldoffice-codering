var Session = require("veldoffice/Session");
var this_uri = this.vars(["resource.uri", true]);
var ws = this.up("devtools/Workspace<>");

var editors = { 
	// all: ws.qs("#editor-needed").execute(js.normalize(this_uri, "./all.js")),
	nl_NL: ws.qs("#editor-needed").execute(js.normalize(this_uri, "./locales/nl.json")),
	en_UK: ws.qs("#editor-needed").execute(js.normalize(this_uri, "./locales/en.json")),
};

/* The following entities are ignored for GT */
var BRO = [ "ApparaatType", "BemonsteringsKwaliteit", "BemonsteringsMethodeBRO", "BemonsteringsProcedure", "BeschrijfKwaliteit", "BeschrijfKwaliteitBL", "BeschrijfLocatie", "BeschrijfProcedure", "BijzonderMateriaal", "BoorProcedure", "BoorTechniek", "ConsistentieFijn", "DisperseInhomogeniteit", "Gelaagdheid", "GrindMediaan", "GrondsoortBRO", "JaNeeIndicatie", "Kaderaanlevering", "KaderinstellendeProcedure", "Kaderinwinning", "Kalkgehalte", "KleurBRO", "KorrelHoekigheid", "KorrelRuwheid", "KorrelSfericiteit", "KorrelgrootteBereik", "LaagGrensBepaling", "MaaiveldType", "Monstervochtigheid", "OrganischeStofgehalte", "TertairBestanddeel", "Vakgebied", "VeenConsistentie", "VeenTextuur", "VezelTreksterkte", "ZandMediaan" ];

var all = {}, root = { 
	// all: {}, 
	nl_NL: {}, 
	en_UK: {} 
};
var loading = this.scope().loading;

function split() {
	for(var type in all) {
		for(var locale in root) {
			// ws.print(locale + ":" + type, all[type]);
			root[locale][type] = all[type].map(function(item) {
				var r = js.mixIn(item);
				delete r.l;

				var fields = item.l;
				for(var f in fields) {
					r[f] = fields[f][locale] || fields[f].nl_NL || (type + "#" + item.id);
				}
				
				return r;
			});
		}
	}
	
	editors.nl_NL.setValue(JSON.stringify(root.nl_NL));
	editors.en_UK.setValue(JSON.stringify(root.en_UK));
}

loading.show();

Session
	.get("/office-rest/rest/v1/codering")
	.then(coderingen => Promise.all(coderingen
		.filter(_ => !BRO.includes(_.name))
		.filter(_ => _.name.toLowerCase() !== "codering")
		.sort((i1, i2) => i1.name < i2.name ? -1 : 1)
		.map(_ => (all[_.name] = Session.get("/office-rest/rest/v1/codering/" + _.name))
			.then(res => all[_.name] = res.map(function(item) {
				item.l = item.__localeFields;
				delete item.actief; delete item.__localeFields;
				delete item.type;
				return item;
			}))
		))
	)
	.then(function(res) {
		ws.print("promise result", res);
		ws.print("root", root);
		ws.print("editors", editors);

		for(var k in editors) {
			ws.print("editors." + k, (editors[k] = editors[k].down(":root #ace")));
		}
		
		ws.print("if null appeared above, open corresponding editor/document in workspace");
		
		loading.hide();
		
		split(all);
		return js.mixIn({all: all}, root);
	});
	