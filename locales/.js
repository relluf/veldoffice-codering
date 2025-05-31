const root = ws.qs("#console #console")[0];
const urns = {};

for(var k in root) {
	root[k].map(codering => {
		
		const urn = js.get("export.SIKB135", codering);
		if(typeof urn === "string" && urn.length) {
			urns[urn] = codering;
		}
		
	});
}

({ urns, name: "sorted urns" });