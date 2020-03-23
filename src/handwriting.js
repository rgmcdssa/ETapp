// JavaScript Document
var fudge = 10;
class Line {

	constructor(a,b,c,d,e) {
		this.x1=a; this.y1=b; this.x2=c; this.y2=d; this.original=e; 
	}

	continuous(oth) {
		return(this.x1==oth.x2 && this.y1==oth.y2);	
	}
	
	solveLine() {
		var sw=(this.y2-this.y1)/(this.x2-this.x1);
		if (!isFinite(sw)) 
			return({k: this.x1});
		else 
			return({slope: sw,intercept: (this.y1-(this.y2-this.y1)/(this.x2-this.x1)*this.x1)});
	}
	
	minX() {
		return((this.x1<this.x2)?this.x1:this.x2);
	}
	
	minY() {
		return((this.y1<this.y2)?this.y1:this.y2);
	}
	
	maxX() {
		return((this.x1>this.x2)?this.x1:this.x2);
	}
	
	maxY() {
		return((this.y1>this.y2)?this.y1:this.y2);
	}
	
	shift(s) {
		var params = this.solveLine();
		if (params.k != undefined)
			return(new Line(this.x1+s,this.y1,this.x2+s,this.y2,false));
		else
			return(new Line(this.x1+s,(params.slope*(this.x1+s)+params.intercept),this.x2+s,(params.slope*(this.x2+s)+params.intercept),false));
	}
	
	expand() {
		var params = this.solveLine();
		var oth=new Line(0,0,0,0,false);
		if (params.k != undefined) {
			oth.x1=this.x1; oth.x2=this.x2;
			oth.y1=this.y1+fudge; oth.y2=this.y2+fudge;
		} else {
		oth.x1=oth.x1-fudge; oth.x2=oth.x2+fudge; 
		oth.y1 = params.slope*oth.x1+params.intercept;
		oth.y2 = params.slope*oth.x2+params.intercept; 
		}
		return(oth);
	}
	
	intersect(oth) {

		var thisLine = this.solveLine();
		var otherLine = oth.solveLine();
		
		var intX = (otherLine.intercept - thisLine.intercept) / (thisLine.slope - otherLine.slope);
		
		var minBound = (this.minX()>oth.minX()?this.minX():oth.minX());
		var maxBound = (this.maxX()<oth.maxX()?this.maxX():oth.maxX());
		
		return(intX > minBound && intX < maxBound);
	}
	
};

//Join together drawn lines that are part of the same letter because some part of them intersects. 
function collapseLines() {
	for (var i=lines.length-1; i>0; i--) {
		var intersects = false; 
		for (var j=0; j<lines[i].length; j++) {
			for (var k=0; k<lines[i-1].length; k++) {
				if (lines[i-1][k].intersect(lines[i][j])) {
					intersects = true; 
					break; 
				}
			}
			if (intersects) break; 
		}
		if (intersects) {
			for (var j=0; j<lines[i].length; j++) {
				lines[i-1].push(lines[i][j]);
			}
			intersects = false; 
			lines.splice(i,1);
		}
	}
}

//Find a bounding box that holds all the lines in an array. 
function boundLine(a) {
	var minX=1000000; var maxX=0; var minY=1000000; var maxY=0;
	
	for (var i=0; i<a.length;i++) {
		if (a[i].minX() < minX)
			minX = a[i].minX();
		if (a[i].maxX() > maxX)
			maxX = a[i].maxX();
		if (a[i].minY() < minY)
			minY = a[i].minY();
		if (a[i].maxY() > maxY)
			maxY = a[i].maxY();
	}
	
	return(new Line(minX,minY,maxX,maxY,true));
}

//Draw the square calculated from boundLine(). 
function drawBounds(a) {
	var ctx=document.getElementById("mainCanvas").getContext("2d");
	ctx.beginPath();
	ctx.strokeStyle = "black";
	ctx.globalAlpha=0.5; 
	ctx.moveTo(a.x1,a.y1);
	ctx.lineTo(a.x2,a.y1);
	ctx.lineTo(a.x2,a.y2);
	ctx.lineTo(a.x1,a.y2);
	ctx.lineTo(a.x1,a.y1);
	ctx.stroke();
	ctx.globalAlpha=1.0;
}

function featherLines() {
	for (var i=0; i<lines.length; i++) {
		var collector=[];
		for (var j=0; j<lines[i].length; j++) {
			collector.push(lines[i][j]);
			collector.push(lines[i][j].expand());
			for (var k=1; k<=fudge; k++) {
			collector.push(lines[i][j].shift(-1*k));
			collector.push(lines[i][j].shift(k));
			}
		}
		lines[i]=collector; 
	}
}

function cleanLines() {
	for (var i=0; i<lines.length; i++) {
		var collector=[];
		for (var j=0; j<lines[i].length; j++)
			if (lines[i][j] != undefined)
				if (lines[i][j].original)
					collector.push(lines[i][j]);
		lines[i]=collector;
	}
}

//Run all these helper functions to bound these letters. 
var allLetters = [];
function findAllLetters() {
	lines = [];
	collectLines();
	// Add lines next to the existing lines. 
	featherLines();
	collapseLines();
	cleanLines();

	//Feather the lines so that letters with weird endpoints actually calculate as overlapping. 
	for (var i=0; i<lines.length;i++) {
		allLetters.push(boundLine(lines[i]));
		drawBounds(allLetters[allLetters.length-1]);
	}
}

class Letter {
	
	constructor(a) {
		this.lineHolder.push(a);
	}
	
	
};

var lines = [];
function collectLines() {
	lines = [];
	var collect = [];
	collect.push(allLines[0]);
	for (var i=1; i<allLines.length; i++) {
		if (allLines[i].continuous(allLines[i-1])) {
			collect.push(allLines[i]);
		}
		else {
			lines.push(collect);
			collect = [];
		}
	}
	lines.push(collect);
}

var resultStore = [];
var plotting = false;
function togglePlot() {
	plotting = !plotting;
	var cv=document.getElementById("mainCanvas");
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


var ctx; 
var allLines = [];
function handleEvents() {
	
	document.getElementById("mainCanvas").onmousedown = function(e) {
		e.preventDefault(); 
		ctx=document.getElementById("mainCanvas").getContext("2d");
		ctx.fillStyle="black";
		ctx.globalAlpha=1.0; 
		ctx.beginPath();
		ctx.moveTo(e.pageX-e.target.offsetLeft,e.pageY-e.target.offsetTop);
		
		if (startX == -1 && startY == -1) {
			startX = e.pageX-e.target.offsetLeft;
			startY = e.pageY-e.target.offsetTop; 
		}
	}
	
	document.getElementById("mainCanvas").onmousemove = function(e) {
		e.preventDefault(); 
	if (e.buttons==1) {
		ctx.lineTo(e.offsetX,e.offsetY);
		ctx.stroke();
		allLines.push(new Line(startX,startY,e.offsetX,e.offsetY,true));
		startX = e.offsetX; startY = e.offsetY; 
	}
	}

	document.getElementById("mainCanvas").onmouseup = function(e) {
		e.preventDefault();
		startX = -1; startY = -1; 
	}
	
	document.getElementById("mainCanvas").ontouchstart = function(e) {
		e.preventDefault(); 
		ctx=document.getElementById("mainCanvas").getContext("2d");
		ctx.fillStyle="black";
		ctx.globalAlpha=1.0; 
		ctx.beginPath();
		ctx.moveTo(e.pageX-e.target.offsetLeft,e.pageY-e.target.offsetTop);
		
		if (startX != -1 && startY != -1) {
			startX = e.pageX-e.target.offsetLeft;
			startY = e.pageY-e.target.offsetTop; 
		}
	}
	
	document.getElementById("mainCanvas").ontouchmove = function(e) {
		e.preventDefault(); 
	if (e.buttons==1) {
		allLines.push(new Line(startX,startY,e.offsetX,e.offsetY,true));
		ctx.lineTo(e.pageX-e.target.offsetLeft,e.pageY-e.target.offsetTop);
		startX = e.offsetX; startY = e.offsetY; 
	}
	}
	
	document.getElementById("mainCanvas").ontouchend = function(e) {
		e.preventDefault(); 
		startX = -1; startY = -1;
	}
}

function drawResults(a) {
	resultStore = a;
	
	clearCanvas();
	var ctx=document.getElementById('mainCanvas').getContext('2d');
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

var startX, startY;
function pageLoad() {

startX = -1; startY = -1; 
	
resizeCanvas();
originX=document.getElementById('mainCanvas').width*0.45;
originY=document.getElementById("mainCanvas").height*0.5;

window.setInterval(intervalWrapper,20);
window.addEventListener('resize',resizeCanvas, false);

openDB();
handleEvents();
}

var mouseDownTime = 0;
var mouseUpTime = 0;
var touchDownTime = 0;
var touchUpTime = 0;

function returnHome() {
	window.location.href = './index.html';
}

function intervalWrapper() {
	if (!plotting) {
		document.getElementById('plotArea').innerHTML = "";
	}
	else {
		getResults('bullseye');
	}
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
	
	
	var ctx=document.getElementById("mainCanvas").getContext("2d");
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
 
	var ctx=document.getElementById("mainCanvas").getContext("2d");
	ctx.globalAlpha=0.6;
	ctx.strokeStyle="grey";
	ctx.beginPath();
	ctx.arc(originX,originY,document.getElementById("mainCanvas").width*(drawBackgroundbullseye/100),0,2*Math.PI);
	ctx.stroke();

}

function clearCanvas() {
	var cv=document.getElementById("mainCanvas");
	var ctx=cv.getContext("2d");
	ctx.fillStyle="white";
	ctx.fillRect(0,0,cv.width,cv.height);
	lhbullseye = [];
	rhbullseye = [];
	drawbullseye = [];
	allLines = []; 
	lines=[];
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
		document.getElementById('hand').src='./img/right.jpg';
	}
	else {
		currentHand = "L"; 
		document.getElementById('hand').src='./img/left.jpg';
	}
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
	document.getElementById("mainCanvas").width = 400;
	document.getElementById("mainCanvas").height = 315;
	
	clearCanvas();		
}// JavaScript Document