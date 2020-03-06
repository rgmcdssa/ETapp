

function fftResults(signal) {
	var fft = new p5.FFT();
}

class spiralPoint {

	constructor(xx,yy,tt) {
		this.spiralPointColor="black";
		this.pointSize=1;
	
		this.xpos=xx;
		this.ypos=yy;
		this.time=tt;
	
		var offsetX = 0; var offsetY = 0;
		if (currentSpiral == 0) { offsetX = originX; offsetY = originY; }
		else if (currentSpiral == 2) { offsetX = originX; offsetY = originY*2; } 	
		else if (userSpiral.length > 0) { offsetX = userSpiral[0].xpos; offsetY = userSpiral[0].ypos; }
		else { offsetX = xx; offsetY = yy; }
		this.r=Math.sqrt(Math.pow(xx-offsetX,2)+Math.pow(yy-offsetY,2));
		this.phi=Math.atan2(yy-offsetY,xx-offsetX);
	}
	
	drawSpiralPoint(start) {	
		var cv=document.getElementById("spiralCanvas");
		var ctx=cv.getContext("2d");
		ctx.strokeStyle=this.spiralPointColor;
		ctx.beginPath();
		ctx.moveTo(start.xpos,start.ypos);
		ctx.lineTo(this.xpos,this.ypos);	
		ctx.stroke();
	}
	
	euclidDistance(p) {
		return(Math.sqrt(Math.pow(this.xpos-p.xpos,2)+Math.pow(this.ypos-p.ypos,2)));		
	}
	
	radDistance(p) {
		var dr=(this.r-p.r);
		return(dr);	
	}

	timeDifference(p) {
		var dt=(this.time>p.time?this.time-p.time:1);
		return(dt);
	}

	drdt(p) {
		return(Math.abs(this.radDistance(p)/this.timeDifference(p)));
	}
		
	angularDifference(p) {
		return((this.phi!=p.phi?this.phi-p.phi:0.1));
	}
	
	drdphi(p) {
		return(Math.abs(this.radDistance(p)/this.angularDifference(p)));
	}
	
	dispFromSpiral() {
		if (currentSpiral == 0) { drawSpiral = lhSpiral; }
		else if (currentSpiral == 2) { drawSpiral = lhSpiral; }
		var minDist=1000000;var mini=0;
		var ctx=document.getElementById("spiralCanvas").getContext("2d");
		ctx.strokeStyle="red";
		ctx.beginPath();
		ctx.moveTo(this.xpos,this.ypos);
		for (i=0;i<200;i++) {
			var cDist=this.euclidDistance(drawSpiral[i]);
			if (cDist<minDist) {
				minDist=cDist;	
				mini=i;
			}
		}	
		ctx.lineTo(drawSpiral[mini].xpos,drawSpiral[mini].ypos);
		ctx.stroke();	
		return(minDist);
	}	
};

let db; 
function openDB() {
	let dbReq = indexedDB.open('ETdatabase',1);
	dbReq.onupgradeneeded = function(event) {
		db = event.target.result; 
		let storage = db.createObjectStore('spiralStorage', {autoIncrement: true});
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

function getResults() {
	let tx = db.transaction(['spiralStorage'],'readonly');
	let item = tx.objectStore('spiralStorage');
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
	var req=indexedDB.deleteDatabase('spiralStorage');
	req.onsuccess = function(event) { alert('Success.');}
	req.onblocked = function(event) {alert('Blocked.');}
	req.onerror = function(event) { alert(event.target.errorCode);}
}

var resultStore = [];
var plotting = false;
function togglePlot() {
	plotting = !plotting;
	var cv=document.getElementById("spiralCanvas");
	cv.width = (plotting?0:320);
	cv.height = (plotting?0:320);
}

function procResults() {
	var collect = [];
	for (i=0;i<resultStore.length;i++) {
		var hold = resultStore[i].text.split("±");
		collect.push(hold[0],hold[1]);
	}
	return(collect);
}

function procDate(a) {
	return(a.getMonth()+"/"+a.getDate()+"/"+a.getYear()+" "+a.getHours()+":"+a.getMinutes()+":"+a.getSeconds());
}

function plotResults(a) {
	resultStore = a;
	document.getElementById('plotArea').innerHTML = "";
	
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

function drawResults(a) {
	resultStore = a;
	
	clearCanvas();
	var ctx=document.getElementById('spiralCanvas').getContext('2d');
	ctx.strokeStyle='black';
	ctx.globalAlpha = 1.0;
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.moveTo(50,50);
	ctx.lineTo(50,250);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(50,250);
	ctx.lineTo(250,250);
	ctx.stroke();
	
	res = procResults();
	ctx.strokeStyle='green';
	ctx.beginPath();
	ctx.moveTo(50,250);
	for (i=0;i<res.length;i+=2) {
		ctx.lineTo(50+((i+1)/2)*20,250-res[i]*5);
		ctx.moveTo(50+((i+1)/2)*20,250-res[i]*5);
	}
	ctx.stroke();
	
	ctx.globalAlpha = 0.3;
	ctx.beginPath();
	ctx.moveTo(50,250);
	for (i=1;i<res.length;i+=2) {
		ctx.lineTo(50+((i+1)/2)*20,250-(res[i-1]+res[i])*5);
		ctx.moveTo(50+((i+1)/2)*20,250-(res[i-1]+res[i])*5);
	}
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(50,250);
	for (i=1;i<res.length;i+=2) {
		ctx.lineTo(50+((i+1)/2)*20,250-(res[i-1]-res[i])*5);
		ctx.moveTo(50+((i+1)/2)*20,250-(res[i-1]-res[i])*5);
	}
	ctx.stroke();
	
	ctx.globalAlpha = 1.0;
	ctx.fillStyle='black';
}

function pageLoad() {

document.getElementById("spiralCanvas").onmousemove = function(e) {
	if (e.buttons==1){
	var cv=document.getElementById("spiralCanvas");
	var bounds=cv.getBoundingClientRect();
	var d=new Date();
	userSpiral.push(new spiralPoint(e.offsetX,e.offsetY,d.getTime()));
	}
}

originX=document.getElementById("spiralCanvas").width*0.5;
originY=document.getElementById("spiralCanvas").height*0.5;

window.setInterval(intervalWrapper,20);
window.addEventListener('resize',resizeCanvas, false);
resizeCanvas();
openDB();
}

function returnHome() {
	window.location.href = './etapp.home.html';
}

function intervalWrapper() {
	if (!plotting) {
		document.getElementById('plotArea').innerHTML = "";
		drawUserSpirals();
	}
	else {
		getResults();
	}
}

function drawUserSpirals() {
	if (!analyzed) clearCanvas();
	if (drawBackgroundSpiral) 
		drawBGSpiral();
	var ctx=document.getElementById("spiralCanvas").getContext("2d");	
	ctx.strokeStyle="black";
	ctx.globalAlpha=1.0;
	for (i=1;i<userSpiral.length;i++)
		userSpiral[i].drawSpiralPoint(userSpiral[i-1]);
}

function mean_drdt() {
	var mean=0;	
	for (i=1;i<userSpiral.length;i++)
		mean+=(userSpiral[i].drdt(userSpiral[i-1]));
	return((mean/(userSpiral.length-1)).toFixed(3));
}

function mean_drdphi() {
	var mean=0;	
	for (i=1;i<userSpiral.length;i++)
		mean+=(userSpiral[i].drdphi(userSpiral[i-1]));
	return((mean/(userSpiral.length-1)).toFixed(3));
}

function spiralError() {
	var RMSE=[];	
	for (ji=0;ji<userSpiral.length;ji++) {
		RMSE.push(Math.pow(userSpiral[ji].dispFromSpiral(),1));	
	}
	var mean = RMSE.reduce((a,b) => a + b, 0) / RMSE.length;
	var std = 0;
	for (ji=0;ji<RMSE.length;ji++) 
		std = std + Math.pow(RMSE[ji]-mean,2);
	std = std / RMSE.length;
	
	var ctx=document.getElementById("spiralCanvas").getContext("2d");
        ctx.strokeStyle="red";
        ctx.globalAlpha=1.0;
	ctx.beginPath();
	ctx.moveTo(10,100);
	for (ji=0;ji<RMSE.length;ji++) {
		ctx.lineTo(10+ji,100+RMSE[ji]);
	}		
	ctx.stroke();

	return([(mean).toFixed(2), (Math.sqrt(std,2)).toFixed(2)]);			
}

function analyzeSpiral() {
	analyzed = true;
	var print = "";
	/*if (currentSpiral == 0 || currentSpiral == 2) { print = ("drdt: "+mean_drdt()+" drdphi: "+mean_drdphi()+" RMSE: "+spiralError()); }
	else {  print = ("drdt: "+mean_drdt()+" drdphi: "+mean_drdphi()); }*/
	var error = spiralError(); 
	document.getElementById("resultsBar").innerHTML = "Error: " + error[0] + "±" + error[1];
}

function drawBGSpiral() {

	originX=document.getElementById("spiralCanvas").width*0.5;
	originY=document.getElementById("spiralCanvas").height*0.5;
	var angleMod = (drawBackgroundSpiral>0?drawBackgroundSpiral:-10)+5; 
	var ctx=document.getElementById("spiralCanvas").getContext("2d");
	ctx.globalAlpha=0.6;
	ctx.strokeStyle="lightgrey";
	ctx.beginPath();	
	ctx.moveTo(originX,originY);	
	for (i=0;i<200;i++) {
		var angle=0.1*i;
		x=(angleMod*angle)*Math.cos(angle);
		y=(angleMod*angle)*Math.sin(angle);
		lhSpiral.push(new spiralPoint(x+originX,y+originY,0));
		ctx.lineTo(x+originX,y+originY);
	}	
	ctx.stroke();

}

function clearCanvas() {
	var cv=document.getElementById("spiralCanvas");
	var ctx=cv.getContext("2d");
	ctx.fillStyle="white";
	ctx.fillRect(0,0,cv.width,cv.height);
	lhSpiral = [];
	rhSpiral = [];
	drawSpiral = [];
}

function resetSpiral() {
	analyzed = false;
	userSpiral.length=0;
	userSpiral=[];
	clearCanvas();
	drawBGSpiral();
	document.getElementById("resultsBar").innerHTML = "Error: ";
}

var currentHand = "L";
function handleButton() {
	if (currentHand == "L") {
		currentHand = "R"; 
		document.getElementById('hand').src='./img/left.jpg';
	}
	else {
		currentHand = "L"; 
		document.getElementById('hand').src='./img/right.jpg';
	}
}

function emailResults() {
	/*var results = document.getElementById("footer").innerHTML;
	if (results = "") analyzeSpiral();
	
	Email.send({
	Host: "smtp.gmail.com",
	Username: "rgmcds@gmail.com",
	Password: "thetawaveCOMMANDERPANTS",
	To: "rgmcds@gmail.com",
	From: "rgmcds@gmail.com",
	Subject: (new Date() + " results"),
	Body: "" + results, 
	}).then(message => alert("Results sent.");
	);*/		
}

function toggleSpiral() {
	drawBackgroundSpiral++;
	if (drawBackgroundSpiral > 5) {
		drawBackgroundSpiral = 0; 
	}
	clearCanvas();
	drawBGSpiral();
}

function resizeCanvas() {
	document.getElementById("spiralCanvas").width = 320;
	document.getElementById("spiralCanvas").height = 320;
	clearCanvas();		
}// JavaScript Document