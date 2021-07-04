async function loadObj(location) {
	
	// fetch is explained at https://www.youtube.com/watch?v=tc8DU14qX6I.
	let response = await fetch(location);
	let txt = await response.text();
	let lines = txt.split(/\r*\n/);
	
	let v = [];
	let vt = [];
	let vn = [];
	let buffer = [];

	for (let line of lines) {
		let data = line.trim().split(/\s+/);
		let type = data.shift();
		if (type == 'v') {
			v.push(data.map(parseFloat));
		}
		else if (type == 'vt') {
			vt.push(data.map(parseFloat));
		}
		else if (type == 'vn') {
			vn.push(data.map(parseFloat));
		}
		else if (type == 'f') {
			for (let fp of data) {
				let idx = fp.split('/').map( (x) => {return parseInt(x)} );
				v[idx[0]-1].forEach( (x) => {buffer.push(x)} );
				vt[idx[1]-1].forEach( (x) => {buffer.push(x)} );
				vn[idx[2]-1].forEach( (x) => {buffer.push(x)} );
			}
		}
	}
	return buffer;
};