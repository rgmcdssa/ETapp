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
	
	var result =spiralError(5,0,1); 
	//result = result.substring(7);
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
	var label=(a.getHours()>12?"PM":"AM");
	var hours=(a.getHours()>12?a.getHours()-12:a.getHours());
	var minutes=(a.getMinutes()>9?a.getMinutes():"0"+a.getMinutes());
	return((a.getMonth()+1)+"/"+a.getDate()+"/"+(a.getYear()+1900)+" "+hours+":"+minutes+label);
}

function arrayMean(arg) { 
  if (plotType ==1) {
    return(arg[0]);
  }
  var mean=0; 
  for (var i=0; i<arg.length; i++) {
    mean += parseFloat(arg[i]);
  }
  return((mean/arg.length).toFixed(2));
}

function firstLast(arg,trim=3) {
  if (plotType ==1) {
    return(arg[0]);
  }
  return(arg[0]+"-"+arg[trim]);
}

//Find the center of the error cluster and then calculate how far each point is from it.
//Not the most elegant solution, but necessary without vector operations. 
function calculateSelfDistances(a) {

    var out = [];
    var center = 0; var minc=1000000; 
    var inds = [];
    var pt = document.getElementById("userInfo").value; 
    //for (var i=0; i<toKeep.length;i++) { center.push(0); }
    for (i=0; i<a.length; i++) {
      if (a[i].patient == pt || pt == "") {
        inds.push(i);
        if (parseFloat(arrayMean(checkLearnedSpiral(a[i].text,0,plotType))) < minc) { 
          minc = parseFloat(arrayMean(checkLearnedSpiral(a[i].text,0,plotType))); center = i; 
        }
      }
    }

    //Calculate mean, sd so we can do z scores. 
    var m = []; var mean = 0; var sd = 0;
    for (i=0; i<inds.length; i++) {
        //if (i!=center) { m.push(euclidDist(dists[i],dists[center]).toFixed(2)); }
        //Use mean of ratios instead of actual calculated distances.
        if (inds[i]!=center) { m.push((arrayMean(checkLearnedSpiral(a[inds[i]].text,0,plotType))/arrayMean(checkLearnedSpiral(a[center].text,0,plotType))).toFixed(2)); }
        mean += parseFloat(m[m.length-1]);
    }  
    mean /= m.length; 
    for (i=0; i<inds.length; i++) { sd = (m[i]-mean)^2; }
    sd = Math.sqrt(sd / m.length);
   
    var c=0; 
    for (i=0; i<inds.length; i++) {
      if (inds[i] == center) {
        out.push(1.0);
      }
      else if (a[inds[i]].patient == pt || pt == "") {
        if (sd == 0) { out.push(0); }
        out.push(m[c++]); }
      else {
        out.push(1000000);
      }
    }
    
    return(out);
}

var plotType = 0; 
function plotResults(a,targetTest) {
	resultStore = a;
	document.getElementById("plotArea").innerHTML = "";
	var toggleDiv = document.createElement('p');
	toggleDiv.setAttribute('onclick',"plotType=(plotType==0?1:0);getResults('spiral');");
	toggleDiv.textContent = "Toggle spiral value type";
  document.getElementById('plotArea').appendChild(toggleDiv);
  
  var selfs = calculateSelfDistances(resultStore); 

	var tbl = document.createElement('table');
	var tblBody = document.createElement('tbody');
	var h=document.createElement('tr');
	var patientInfo = document.getElementById('userInfo').value;
	
	var h1 = document.createElement('th');
	var h2 = document.createElement('th');
	var h3 = document.createElement('th');
	var h4 = document.createElement('th');
	var h5 = document.createElement('th');
	
	h1.appendChild(document.createTextNode('Patient'));
	h2.appendChild(document.createTextNode('Date'));
	h3.appendChild(document.createTextNode('Hand'));
	h4.appendChild(document.createTextNode('Error Ratio'));
	h5.appendChild(document.createTextNode('Z-score Self'));
	h.appendChild(h1); h.appendChild(h2); h.appendChild(h3); h.appendChild(h4); h.appendChild(h5);
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
		var c5=document.createElement('td');
		
		c1.appendChild(document.createTextNode(resultStore[i].patient));
		row.appendChild(c1);
		
		c2.appendChild(document.createTextNode(procDate(new Date(resultStore[i].timestamp))));
		row.appendChild(c2);
		
		c3.appendChild(document.createTextNode(resultStore[i].hand));
		row.appendChild(c3);

		c4.appendChild(document.createTextNode(firstLast(checkLearnedSpiral(resultStore[i].text,0,plotType))));
		row.appendChild(c4);
		
		c5.appendChild(document.createTextNode(selfs[i]));
		row.appendChild(c5);
		
		tblBody.appendChild(row);
	}
		 
	tbl.appendChild(tblBody);
	
	document.getElementById('plotArea').appendChild(tbl);
	
	document.getElementById('plotArea').height=300; 
	
}

function clearDatabase() {
	var req=indexedDB.deleteDatabase('storage');
	req.onsuccess = function(event) { alert('Success.');}
	req.onblocked = function(event) {alert('Blocked.');}
	req.onerror = function(event) { alert(event.target.errorCode);}
}
// JavaScript Document