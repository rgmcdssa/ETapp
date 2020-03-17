let db; 
function openDB() {
	let dbReq = indexedDB.open('ETdatabase',1);
	dbReq.onupgradeneeded = function(event) {
		db = event.target.result; 
		let storage = db.createObjectStore('storage', {autoIncrement: true});
	}
	dbReq.onsuccess = function(event) {
		db = event.target.result; 
	}
	
	dbReq.onerror=function(event) {
		alert('Error opening database: '+event.target.errorCode);
	}
}

function saveResults(targetTest) {
	if (db==null) { openDB(); }
	let tx=db.transaction(['storage'],'readwrite');
	let store = tx.objectStore('storage');
	
	var result = document.getElementById('resultsBar').innerHTML;
	result = result.substring(7);
	var patientInfo = document.getElementById('userInfo').value;
	
	let item = {patient: patientInfo, text: result, timestamp: Date.now(), hand: currentHand, test: targetTest};
	store.add(item);
	
	tx.oncomplete = function() { alert('Storage complete.');
	}
	tx.onerror = function(event) {
		alert('Error storing: '+event.target.errorCode);
	}
}

function getResults(targetTest) {
	let tx = db.transaction(['storage'],'readonly');
	let item = tx.objectStore('storage');
	let req = item.openCursor();
	let allItems = [];
	
	req.onsuccess = function(event) {
		let cursor=event.target.result;
		if (cursor != null) {
			allItems.push(cursor.value);
			cursor.continue();
		}
		else {
			plotResults(allItems,targetTest);
		}
	}
	
	req.onerror = function(event) {
		alert('Error in plot: '+event.target.errorCode);
	}
}

function procDate(a) {
	return((a.getMonth()+1)+"/"+a.getDate()+"/"+(a.getYear()+1900)+" "+a.getHours()+":"+a.getMinutes()+":"+a.getSeconds());
}

function plotResults(a,targetTest) {
	resultStore = a;
	document.getElementById("plotArea").innerHTML = "";

	var tbl = document.createElement('table');
	var tblBody = document.createElement('tbody');
	var h=document.createElement('tr');
	var patientInfo = document.getElementById('userInfo').value;
	
	var h1 = document.createElement('th');
	var h2 = document.createElement('th');
	var h3 = document.createElement('th');
	var h4 = document.createElement('th');
	
	h1.appendChild(document.createTextNode('Patient'));
	h2.appendChild(document.createTextNode('Date'));
	h3.appendChild(document.createTextNode('Error'));
	h4.appendChild(document.createTextNode('Hand'));
	h.appendChild(h1); h.appendChild(h2); h.appendChild(h3); h.appendChild(h4);
	tblBody.appendChild(h);
	
	for (i=0; i<resultStore.length; i++) {
		if (patientInfo != "")
			if (patientInfo != resultStore[i].patient)
				continue; 
		if (resultStore[i].test != targetTest)
			continue;
		
		var row=document.createElement('tr');
		
		var c1=document.createElement('td');
		var c2=document.createElement('td');
		var c3=document.createElement('td');
		var c4=document.createElement('td');
		
		c3.appendChild(document.createTextNode(resultStore[i].patient));
		row.appendChild(c3);
		
		c2.appendChild(document.createTextNode(procDate(new Date(resultStore[i].timestamp))));
		row.appendChild(c2);
		
		c1.appendChild(document.createTextNode(resultStore[i].text));
		row.appendChild(c1);
		
		c4.appendChild(document.createTextNode(resultStore[i].hand));
		row.appendChild(c4);
		tblBody.appendChild(row);
	}
		 
	tbl.appendChild(tblBody);
	
	document.getElementById('plotArea').appendChild(tbl);
}

function clearDatabase() {
	var req=indexedDB.deleteDatabase('storage');
	req.onsuccess = function(event) { alert('Success.');}
	req.onblocked = function(event) {alert('Blocked.');}
	req.onerror = function(event) { alert(event.target.errorCode);}
}
// JavaScript Document