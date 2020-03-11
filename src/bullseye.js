

function fftResults(signal) {
	var fft = new p5.FFT();
}

class bullseyePoint {

	constructor(xx,yy,tt) {
		this.bullseyePointColor="black";
		this.pointSize=1;
	
		this.xpos=xx;
		this.ypos=yy;
		this.time=tt;
	
		var offsetX = 0; var offsetY = 0;
		if (currentbullseye == 0) { offsetX = originX; offsetY = originY; }
		else if (currentbullseye == 2) { offsetX = originX; offsetY = originY*2; } 	
		else if (userbullseye.length > 0) { offsetX = userbullseye[0].xpos; offsetY = userbullseye[0].ypos; }
		else { offsetX = xx; offsetY = yy; }
		this.r=Math.sqrt(Math.pow(xx-offsetX,2)+Math.pow(yy-offsetY,2));
		this.phi=Math.atan2(yy-offsetY,xx-offsetX);
	}
	
	drawbullseyePoint(start) {	
		
		var cv=document.getElementById("bullseyeCanvas");
		var ctx=cv.getContext("2d");
		ctx.strokeStyle=this.bullseyePointColor;
		
		if (this.euclidDistance(start)==0) {
			ctx.beginPath();
			ctx.arc(this.xpos,this.ypos,1,0,2*Math.PI);
			ctx.stroke();
		}
			
		else {
	
		ctx.beginPath();
		ctx.moveTo(start.xpos,start.ypos);
		ctx.lineTo(this.xpos,this.ypos);	
		ctx.stroke();
			
		}
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
	
	dispFrombullseye(p) {	
		return(this.euclidDistance(p));
	}	
};

let db; 
function openDB() {
	let dbReq = indexedDB.open('ETdatabase',1);
	dbReq.onupgradeneeded = function(event) {
		db = event.target.result; 
		let storage = db.createObjectStore('bullseyeStorage', {autoIncrement: true});
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
	let tx=db.transaction(['bullseyeStorage'],'readwrite');
	let store = tx.objectStore('bullseyeStorage');
	
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
	let tx = db.transaction(['bullseyeStorage'],'readonly');
	let item = tx.objectStore('bullseyeStorage');
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
	var req=indexedDB.deleteDatabase('bullseyeStorage');
	req.onsuccess = function(event) { alert('Success.');}
	req.onblocked = function(event) {alert('Blocked.');}
	req.onerror = function(event) { alert(event.target.errorCode);}
}

var resultStore = [];
var plotting = false;
function togglePlot() {
	plotting = !plotting;
	var cv=document.getElementById("bullseyeCanvas");
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
	var ctx=document.getElementById('bullseyeCanvas').getContext('2d');
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

document.getElementById("bullseyeCanvas").onmousemove = function(e) {
	if (e.buttons==1){
	var cv=document.getElementById("bullseyeCanvas");
	var bounds=cv.getBoundingClientRect();
	var d=new Date();
	userbullseye.push(new bullseyePoint(e.offsetX,e.offsetY,d.getTime()));
	}
}

document.getElementById("bullseyeCanvas").addEventListener('mousedown',mouseDownFunction,false);
document.getElementById("bullseyeCanvas").addEventListener('mouseup',mouseUpFunction,false);
document.getElementById("bullseyeCanvas").addEventListener('touchstart',mouseDownFunction,false);
document.getElementById("bullseyeCanvas").addEventListener('touchend',mouseUpFunction,false);
document.getElementById("bullseyeCanvas").addEventListener('vmousedown',mouseDownFunction,false);
document.getElementById("bullseyeCanvas").addEventListener('vmousemove',mouseUpFunction,false);
	
originX=document.getElementById("bullseyeCanvas").width*0.5;
originY=document.getElementById("bullseyeCanvas").height*0.5;

window.setInterval(intervalWrapper,20);
window.addEventListener('resize',resizeCanvas, false);
resizeCanvas();
openDB();
}

var mouseDownTime = 0;
var mouseUpTime = 0;
function mouseDownFunction(e) {
	mouseDownTime = new Date();
}
	
function mouseUpFunction(e) {
	if (mouseDownTime != 0) {
	mouseUpTime = new Date();
	var cv=document.getElementById("bullseyeCanvas");
	var bounds=cv.getBoundingClientRect();
	for (var i=0; i<(mouseUpTime-mouseDownTime)/100;i++)
		userbullseye.push(new bullseyePoint(e.offsetX,e.offsetY,mouseDownTime.getTime()+i*100));
	mouseDownTime = 0; mouseUpTime = 0;
	}
}

function returnHome() {
	window.location.href = './index.html';
}

function intervalWrapper() {
	if (!plotting) {
		document.getElementById('plotArea').innerHTML = "";
		drawUserbullseyes();
	}
	else {
		getResults();
	}
}

function drawUserbullseyes() {
	if (!analyzed) clearCanvas();
	if (drawBackgroundbullseye) 
		drawBGbullseye();
	var ctx=document.getElementById("bullseyeCanvas").getContext("2d");	
	ctx.strokeStyle="black";
	ctx.globalAlpha=1.0;
	for (i=1;i<userbullseye.length;i++)
		userbullseye[i].drawbullseyePoint(userbullseye[i-1]);
}

function mean_drdt() {
	var mean=0;	
	for (i=1;i<userbullseye.length;i++)
		mean+=(userbullseye[i].drdt(userbullseye[i-1]));
	return((mean/(userbullseye.length-1)).toFixed(3));
}

function mean_drdphi() {
	var mean=0;	
	for (i=1;i<userbullseye.length;i++)
		mean+=(userbullseye[i].drdphi(userbullseye[i-1]));
	return((mean/(userbullseye.length-1)).toFixed(3));
}

function max(arr) {
	var maxv=0; 
	for (var i=0;i<arr.length;i++)
		if (maxv<arr[i]) 
			maxv=arr[i];
	return(maxv);
}

function maxInd(arr) {
	var maxv=0; var maxi=0; 
	for (var i=0;i<arr.length;i++)
		if (maxv<arr[i]) {
			maxv=arr[i]; maxi=i; }
	return(maxi);
}

var RMSE; 
var dftResult;
var rads;
var mags;
function bullseyeError() {
	RMSE=[];
	for (ji=1;ji<userbullseye.length;ji++) {
		RMSE.push(Math.pow(userbullseye[ji].dispFrombullseye(userbullseye[0]),1));	
	}
	var mean = RMSE.reduce((a,b) => a + b, 0) / RMSE.length;
	var std = 0;
	for (ji=0;ji<RMSE.length;ji++) 
		std = std + Math.pow(RMSE[ji]-mean,2);
	std = std / RMSE.length;
	
	//rads = []; for (var i=0;i<userbullseye.length;i++) rads.push(toComplexNumber(userbullseye[i].xpos-userbullseye[0].xpos,userbullseye[i].ypos-userbullseye[0].ypos));
	rads = []; for (var i=0;i<userbullseye.length;i++) rads.push(toComplexNumber(userbullseye[i].r,userbullseye[i].phi));
	dftResult = dft(rads);
	mags = [];
	for (var i=0;i<dftResult.length;i++)
		mags.push(complexMagnitude(dftResult[i]).toFixed(2));
	mags[0]=0; 
	var maxMag = mags.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax , 0);
	var fs=(1000/getSamplesPerSec());
	var fss=[]; for (i=0;i<rads.length;i++) fss.push(fs*i/rads.length);
	var freq = fss[maxMag];
	//var freq = maxMag * fs / mags.length;
	
	
	var ctx=document.getElementById("bullseyeCanvas").getContext("2d");
    ctx.strokeStyle="red";
    ctx.globalAlpha=1.0;
	ctx.beginPath();
	ctx.moveTo(10,10);
	for (ji=0;ji<RMSE.length;ji++) {
		ctx.lineTo(10+ji,10+RMSE[ji]);
	}		
	ctx.stroke();
	
	
		
	return([(mean).toFixed(2), (Math.sqrt(std,2)).toFixed(2), freq.toFixed(2)]);			
}

function getSamplesPerSec() {
	var startTime = userbullseye[0].time;
	var currTime = userbullseye[0].time;
	var i;
	for (i=1;i<userbullseye.length;i++) {
		if (userbullseye[i].time - startTime > 1000) 
			break;
	}
	return(i);
}

function analyzebullseye() {
	analyzed = true;
	var print = "";
	/*if (currentbullseye == 0 || currentbullseye == 2) { print = ("drdt: "+mean_drdt()+" drdphi: "+mean_drdphi()+" RMSE: "+bullseyeError()); }
	else {  print = ("drdt: "+mean_drdt()+" drdphi: "+mean_drdphi()); }*/
	var error = bullseyeError(); 
	document.getElementById("resultsBar").innerHTML = "Error: " + error[0] + "±" + error[1] + " " + error[2] + "Hz";
}

function drawBGbullseye() {

	originX=document.getElementById("bullseyeCanvas").width*0.5;
	originY=document.getElementById("bullseyeCanvas").height*0.5; 
	var ctx=document.getElementById("bullseyeCanvas").getContext("2d");
	ctx.globalAlpha=0.6;
	ctx.strokeStyle="grey";
	ctx.beginPath();
	ctx.arc(originX,originY,document.getElementById("bullseyeCanvas").width*(drawBackgroundbullseye/100),0,2*Math.PI);
	ctx.stroke();

}

function clearCanvas() {
	var cv=document.getElementById("bullseyeCanvas");
	var ctx=cv.getContext("2d");
	ctx.fillStyle="white";
	ctx.fillRect(0,0,cv.width,cv.height);
	lhbullseye = [];
	rhbullseye = [];
	drawbullseye = [];
}

function resetbullseye() {
	analyzed = false;
	userbullseye.length=0;
	userbullseye=[];
	clearCanvas();
	drawBGbullseye();
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
	if (results = "") analyzebullseye();
	
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

function togglebullseye() {
	drawBackgroundbullseye++;
	if (drawBackgroundbullseye > 5) {
		drawBackgroundbullseye = 0; 
	}
	clearCanvas();
	drawBGbullseye();
}

function resizeCanvas() {
	document.getElementById("bullseyeCanvas").width = 320;
	document.getElementById("bullseyeCanvas").height = 320;
	clearCanvas();		
}// JavaScript Document