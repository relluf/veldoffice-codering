"use make_locales.js to refresh";

function version1() {
	var Session = require("veldoffice/Session");
	var j$ = require("js/JsObject").$;
	var app = this.app(), ws = this.up("devtools/Workspace<>");
	var ed = this.up("devtools/Editor<>");
	var this_uri = this.vars(["resource.uri", true]);
	
	var en = this.udr("#editor-needed");
	
	var editors = { 
		// all: en.execute(js.normalize(this_uri, "./all.js")),
		// nl_NL: en.execute(js.normalize(this_uri, "./nl_NL.json"), { selected: true }),
		nl_NL: en.execute("Projects/veldoffice-rapportage-scripts/live/lib/veldoffice/codes/nl_NL.json", { selected: true }),
		en_UK: en.execute(js.normalize(this_uri, "./en_UK.json"), { selected: true })
	};
	
	var all = {}, root = { 
		// all: {}, 
		nl_NL: {
			Plasticiteit: [{
				id: 1, xid: 1,  
				naam: "Niet plastisch",
				omschrijving: "Het is niet mogelijk om een rolletje te maken van 3mm ongeacht het watergehalte."
			}, {
				id: 2, xid: 2,  
				naam: "Weinig plastisch",
				omschrijving: "Het is nauwelijks mogelijk om een rolletje te maken en het monster kan niet meer worden samengekneed als het droger is dan de plasticiteitsgrens"
			}, {
				id: 3, xid: 3,  
				naam: "Matig plastisch",
				omschrijving: "Een rolletje kan eenvoudig worden gemaakt en het duurt niet lang om de plasticiteitsgrens te bereiken. Het is niet mogelijk weer een rolletje te maken van  het samengevouwen monster als het de plasticiteitsgrens heeft bereikt. Het materiaal verkruimelt als het droger is dan de plasticiteitsgrens."
			}, {
				id: 4, xid: 4,  
				naam: "Sterk plastisch",
				omschrijving: "Er moet lang worden gekneed en gerold voordat de plasticiteitsgrens is bereikt. Het materiaal kan nog enige keren worden uitgerold nadat de plasticiteitsgrens is bereikt. Het materiaal kan wanneer het droger is dan de plasticiteitsgrens, worden gekneed zonder te verkruimelen."
			}]			
		}, 
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
			ws.print("editors", editors);
	
			for(var k in editors) {
				ws.print("editors." + k, (editors[k] = editors[k].down(":root #ace")));
			}
			
			ws.print("if null appeared above, open corresponding editor/document in workspace");
			
			loading.hide();
			
			split(all);
			return js.mixIn({all: all}, root);
		});
}
function version2() {
	var lastModifiedOf = (e) => VO.em.query(e.name, "max:modified,max:created");

	return VO.session.get("codering")
		.then(_ => _.sort((i1,i2) => i1.name < i2.name ? -1 : 1)
		.filter(_ => !(["KaderinstellendeProcedure", "Codering"].includes(_.name)))
		.map(_ => lastModifiedOf(_).then(lm => {
			var dt = lm[0]['max:modified'] || lm[0]['max:created'] || null;
			return {
				name: _.name, raw: lm,
				lastModified: dt && new Date(dt)
			};
		})))
		.then(_ => Promise.all(_));
}

version2.apply(this, []).then(res => 
	Promise.all(res.map(entry => js.mixIn({ 
		name: entry.name, 
		query: VO.em.query(entry.name, "id,naam,omschrijving,xid") 
	}))));