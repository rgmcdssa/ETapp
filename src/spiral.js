// JavaScript Document

var flag=true; 
var resultStore = [];
var plotting = false;
function togglePlot() {
	plotting = !plotting;
	flag = true; 
	var cv=document.getElementById("spiralCanvas");
	cv.width = (plotting?0:400);
	cv.height = (plotting?0:315);
}

function procResults() {
	var collect = [];
	for (i=0;i<resultStore.length;i++) {
		var hold = resultStore[i].text.split("±");
		collect.push(hold[0],hold[1]);
	}
	return(collect);
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

function addTouchPoint(e) {
	if (!plotting && !analyzing && !snapping) {
	
	e.preventDefault();
	var cv=document.getElementById("spiralCanvas");
	var bounds=cv.getBoundingClientRect();
	var d=new Date();
	if (!androidCheck())
		userSpiral.push(new spiralPoint(e.pageX-e.target.offsetLeft,e.pageY-e.target.offsetTop,d.getTime()));
	else 
		userSpiral.push(new spiralPoint(e.touches[0].pageX-e.target.offsetLeft,e.touches[0].pageY-e.target.offsetTop,d.getTime()));

	flag=true; 
	}
}

function canvasEvents() {
	document.getElementById("spiralCanvas").onmousemove = function(e) {
	if (e.buttons==1 && !analyzing && !plotting && !snapping){
		var cv=document.getElementById("spiralCanvas");
		var bounds=cv.getBoundingClientRect();
		var d=new Date();
		userSpiral.push(new spiralPoint(e.offsetX,e.offsetY,d.getTime()));
		flag=true;
	}
}

document.getElementById("spiralCanvas").addEventListener('touchstart',addTouchPoint,{passive: true});
document.getElementById("spiralCanvas").addEventListener('touchend',addTouchPoint,{passive: true});
document.getElementById("spiralCanvas").addEventListener('touchmove',addTouchPoint,{passive: true});
document.body.addEventListener('contextmenu',function() { return false; },{passive: true});
}

function androidCheck() {
	var ua=navigator.userAgent.toLowerCase();
	return( ua.indexOf("android") > -1);
}

function pageLoad() {
canvasEvents();	
resizeCanvas();
originX=document.getElementById("spiralCanvas").width*0.45;
originY=document.getElementById("spiralCanvas").height*0.5;

window.setInterval(intervalWrapper,20);
window.addEventListener('resize',resizeCanvas, false);

openDB();
makeLearnedSpirals(); 
	
vid=document.getElementById("videoHolder");
}

function returnHome() {
	window.location.href = './index.html';
}

function binarizePicture(img) {
	for (var i=0; i<img.data.length; i+=4) {
		if (img.data[i]+img.data[i+1]+img.data[i+2]>300) {
			img.data[i]=255; img.data[i+1]=255; img.data[i+2]=255; 
		}
		else {
			img.data[i]=0; img.data[i+1]=0; img.data[i+2]=0;
		}
	}
	pictureSpiral(img);
	drawBGSpiral(); 
	return(img); 
}

function pictureSpiral(img) {
	var time=0; 
	for (var i=0; i<img.data.length; i+=4) {
		if (img.data[i]*img.data[i+1]*img.data[i+2]==0) {
			var x=(i*img.width);
			var y=(i/img.width);
			userSpiral.push(new spiralPoint(x,y,time));
			time+=20; 
		}
	}
}

function takePicture() {
	resizeCanvas();
	var cv = document.getElementById("spiralCanvas");
	var ctx = cv.getContext("2d");
	ctx.drawImage(vid,0,0,vid.videoWidth,vid.videoHeight,0,0,cv.width,cv.height);
	var imgDataURL = cv.toDataURL('image/png');
	document.getElementById("videoHolder").width = 0; 
	document.getElementById("videoHolder").height = 0; 
	var stream = vid.srcObject;
	stream.getTracks().forEach(function(track) {track.stop();});
	document.getElementById('plotArea').innerHTML = "";
	var imgClean=binarizePicture(ctx.getImageData(0,0,cv.width,cv.height));
	ctx.putImageData(imgClean,0,0);
	canvasEvents();
}

function setUpSnap() {
	var hold="";
	hold += "<input type='button' value='Take Picture' onclick='takePicture()'></input>";
	
	navigator.getUserMedia({"video":true},function(stream){vid.srcObject=stream; vid.play();},function(err){alert(err)});
	snapset=true;
	return(hold);
}

var snapping=false;
var snapset=false;
var analyzing=false; 
var history = []; 
function intervalWrapper() {
	document.getElementById('plotArea').height=0; 
	
	//First determine if any state variables have changed.
	if (flag==false)
		return(0);
	
	if (analyzing) {
		drawAnalysisPicture(); 
		document.getElementById("videoHolder").width = 0; 
		document.getElementById("videoHolder").height = 0;
	}
	else if (!plotting && !snapping && !analyzing) {
		document.getElementById('plotArea').innerHTML = "";
		drawUserSpirals();
		snapset=false; 
		analyzing=false;
		document.getElementById("videoHolder").width = 0; 
		document.getElementById("videoHolder").height = 0; 
	}
	else if (snapping && !snapset && !analyzing) {
		document.getElementById("spiralCanvas").width=0;
		document.getElementById("spiralCanvas").height=0;
		document.getElementById("videoHolder").width = 400; 
		document.getElementById("videoHolder").height = 315; 
	    document.getElementById("plotArea").innerHTML = setUpSnap();
	    analyzing=false;
	}
	else if (plotting && !analyzing) {
		document.getElementById("videoHolder").width = 0; 
		document.getElementById("videoHolder").height = 0; 
		document.getElementById("spiralCanvas").width=400;
		document.getElementById("spiralCanvas").height=315;
		snapset=false; 
		getResults('spiral');
		analyzing=false;
	}
	
	flag=false; 
}

var error = []; 
function drawAnalysisPicture() {
  var upper = 2;
	var ctx=document.getElementById("spiralCanvas").getContext("2d");
	var cv=document.getElementById("spiralCanvas");
	var img=new Image();
	if (flag) {
		error = spiralError(2); 
		chance = checkLearnedSpiral(spiralError(5,0)); 
	}
	img.onload=function() {
		clearCanvas(); 
		//Draw the BG PPT image. 
		ctx.drawImage(img,0,0,img.width,img.height,0,0,cv.width,cv.height);

    var c = "black";
    if (chance[0] < 1 && chance[upper] < 1.1) { c="green"; }
    else if (chance[upper] < 1.1 && chance.reduce((a,b)=>parseFloat(a)+parseFloat(b))/(chance.length) < 1.1) { c="green"; } 
    else if ((chance[0]>1.1 || chance[1]>1.1)) { c="red"; }
		document.getElementById("chanceInfo").innerHTML = "Chance spiral is abnormal = " + chance[0] + "-" + chance[upper]; 
		document.getElementById("chanceInfo").style.color = c;

		//Now draw the numbers for each value over the text. 
		ctx.fillStyle="blue";
		ctx.font='12px serif';
		ctx.fillText(""+error[3],311,25);
		ctx.fillText(""+error[4],349,133);
		ctx.fillText(""+error[5],324,207);
		ctx.fillText(""+error[6],348,279);
		
		ctx.font='18px serif';
		ctx.fillText(""+error[12]+"±"+error[13],123,40);
		
		ctx.fillText(""+error[8],146,198);
		ctx.fillText(""+error[9],141,223);
		ctx.fillText(""+error[10]+"%",156,266);
		ctx.fillText(""+error[11]+"%",160,296);
		
		flag=false; 
	};
	img.src='img/analysis.jpg';
}

function drawUserSpirals() {
	if (!analyzed) clearCanvas();
	if (drawBackgroundSpiral) 
		drawBGSpiral();
	var ctx=document.getElementById("spiralCanvas").getContext("2d");	
	ctx.fillStyle="blue";
	ctx.globalAlpha=1.0;
	ctx.lineWidth=2.0;
	for (i=1;i<userSpiral.length;i++)
		userSpiral[i].drawSpiralPoint(userSpiral[i-1]);
}

function putUserSpiral(inpt) {
  userSpiral = [];
  inpt=inpt.split(' ');
  for (var i=0; i<inpt.length; i+=2) {
    userSpiral.addTouchPoint()
  }
}

function mean_drdt() {
	var mean=0;	
	for (i=1;i<userSpiral.length;i++)
		mean+=(userSpiral[i].drdt(userSpiral[i-1]));
	return((mean/(userSpiral.length-1)).toFixed(3));
}

function mean_drdtheta() {
	var mean=0;	
	for (i=1;i<userSpiral.length;i++)
		mean+=(userSpiral[i].drdtheta(userSpiral[i-1]));
	return((mean/(userSpiral.length-1)).toFixed(3));
}

function interpolateSpiral() {
	var keep=[];
	for (var i=0; i<userSpiral.length-1; i++) {
		var timeDist = userSpiral[i+1].time - userSpiral[i].time; 
		var xDist = userSpiral[i+1].xpos - userSpiral[i].xpos;
		var yDist = userSpiral[i+1].ypos - userSpiral[i].ypos;
		var steps = (timeDist/sampleRate).toFixed(0);
		for (var j=0; j<(timeDist / sampleRate).toFixed(0); j++)
			keep.push(toComplexNumber((userSpiral[i].xpos+xDist/steps*j)-originX,(userSpiral[i].ypos+yDist/steps*j)));
		
	}
	return(keep);
}

//Draw the template spiral that users can trace from. 
function drawBGSpiral() {

	var angleMod = (drawBackgroundSpiral>0?drawBackgroundSpiral:-10)+5; 
	var ctx=document.getElementById("spiralCanvas").getContext("2d");
	ctx.globalAlpha=0.2;
	ctx.strokeStyle="lightorange";
	ctx.lineWidth=10.0; 
	ctx.beginPath();	
	ctx.moveTo(originX,originY);	
	if (newBackgroundSpiral) {
	for (var i=0; i<lhSpiral.length; i++) { 
	  lhSpiral.pop(); drawSpiral.pop(); 
	}
	}
	for (i=0;i<200;i++) {
		var angle=0.1*i;
		x=(angleMod*angle)*Math.cos(angle);
		y=(angleMod*angle)*Math.sin(angle);
		if (newBackgroundSpiral) { 
		  lhSpiral.push(new spiralPoint(x+originX,y+originY,2000/(200-i)));
	  	drawSpiral.push(new spiralPoint(x+originX,y+originY,2000/(200-i)));
		}
		ctx.lineTo(x+originX,y+originY);
	}
	ctx.stroke();
	
	ctx.globalAlpha=0.4;
	ctx.strokeStyle="orange";
	ctx.lineWidth=1.5; 
	ctx.beginPath();	
	ctx.moveTo(originX,originY);
	for (i=0;i<200;i++) {
	  var angle=0.1*i;
		x=(angleMod*angle)*Math.cos(angle);
		y=(angleMod*angle)*Math.sin(angle);
		ctx.lineTo(x+originX,y+originY);
	}	
	ctx.stroke();
	newBackgroundSpiral = 0;
}

//Clear the entire canvas by painting a white rectangle over the entire thing. Also clear the arrays that hold the background spirals. 
function clearCanvas() {
	var cv=document.getElementById("spiralCanvas");
	var ctx=cv.getContext("2d");
	ctx.fillStyle="white";
	ctx.globalAlpha=1.0; 
	ctx.fillRect(0,0,cv.width,cv.height);
	document.getElementById("chanceInfo").innerHTML = "";
	for (var i=0; i<lhSpiral.length; i++) {
	  lhSpiral.pop(); rhSpiral.pop(); 
	}
	flag=true; 
}

//Clear all of the available spiral data, including analysis, and clear the canvas. 
function resetSpiral() {
	plotting=false;
	snapping=false; 
	analyzed = false;
	analyzing = false; 
	for (var i=0;i<userSpiral.length;i++)
		userSpiral.pop(); 
	userSpiral=[];
	for (var i=0; i<error.length; i++)
		error.pop();
	clearCanvas();
	drawBGSpiral();
	flag=true; 
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

var newBackgroundSpiral = 0;
async function toggleSpiral() {
  newBackgroundSpiral = 1;
	drawBackgroundSpiral++;
	
	if (drawBackgroundSpiral > 5) {
		drawBackgroundSpiral = 0; 
		newBackgroundSpiral = 0; 
		for (var i=0; i<drawSpiral.length; i++) {
		  drawSpiral.pop(); 
		}
	}

	await clearCanvas();
	await drawBGSpiral();
	snapset=false; 
	snapping=false;
	flag=true; 
}

function resizeCanvas() {
	document.getElementById("spiralCanvas").width = 400;
	document.getElementById("spiralCanvas").height = 315;
	clearCanvas();	
	flag=true; 	
}// JavaScript Document

function snapSpiral() {
	snapping=!snapping; 
	plotting=false;
	flag=true;
}