let db; 
function openDB(targdb) {
	let dbReq = indexedDB.open('ETdatabase',1);
	dbReq.onupgradeneeded = function(event) {
		db = event.target.result; 
		let storage = db.createObjectStore(targdb, {autoIncrement: true});
	}
	dbReq.onsuccess = function(event) {
		db = event.target.result; 
	}
	
	dbReq.onerror=function(event) {
		alert('Error opening database: '+event.target.errorCode);
	}
}

function saveResults() {
	if (db==null) { openDB(); }
	let tx=db.transaction(['spiralStorage'],'readwrite');
	let store = tx.objectStore('spiralStorage');
	
	var result = document.getElementById('resultsBar').innerHTML;
	result = result.substring(7);
	var patientInfo = document.getElementById('userInfo').value;
	
	let item = {patient: patientInfo, text: result, timestamp: Date.now(), hand: currentHand};
	store.add(item);
	
	tx.oncomplete = function() { alert('Storage complete.');
	}
	tx.onerror = function(event) {
		alert('Error storing: '+event.target.errorCode);
	}
}

function getResults(targdb) {
	let tx = db.transaction([targdb],'readonly');
	let item = tx.objectStore(targdb);
	let req = item.openCursor();
	let allItems = [];
	
	req.onsuccess = function(event) {
		let cursor=event.target.result;
		if (cursor != null) {
			allItems.push(cursor.value);
			cursor.continue();
		}
		else {
			plotResults(allItems);
		}
	}
	
	req.onerror = function(event) {
		alert('Error in plot: '+event.target.errorCode);
	}
}

function clearDatabase() {
	var req=indexedDB.deleteDatabase(targdb);
	req.onsuccess = function(event) { alert('Success.');}
	req.onblocked = function(event) {alert('Blocked.');}
	req.onerror = function(event) { alert(event.target.errorCode);}
}
// JavaScript Document