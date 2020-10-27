// JavaScript Document



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
		this.theta=Math.atan2(yy-offsetY,xx-offsetX);
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
		return((this.theta!=p.theta?this.theta-p.theta:0.1));
	}
	
	drdtheta(p) {
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


var resultStore = [];
var plotting = false;
function togglePlot() {
	plotting = !plotting;
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
	e.preventDefault();
	var cv=document.getElementById("spiralCanvas");
	var bounds=cv.getBoundingClientRect();
	var d=new Date();
	userSpiral.push(new spiralPoint(e.pageX-e.target.offsetLeft,e.pageY-e.target.offsetTop,d.getTime()));
}

function canvasEvents() {
	document.getElementById("spiralCanvas").onmousemove = function(e) {
	if (e.buttons==1){
	var cv=document.getElementById("spiralCanvas");
	var bounds=cv.getBoundingClientRect();
	var d=new Date();
	userSpiral.push(new spiralPoint(e.offsetX,e.offsetY,d.getTime()));
	}
}

document.getElementById("spiralCanvas").addEventListener('touchstart',addTouchPoint,{passive: true});
document.getElementById("spiralCanvas").addEventListener('touchend',addTouchPoint,{passive: true});
document.getElementById("spiralCanvas").addEventListener('touchmove',addTouchPoint,{passive: true});
}

function pageLoad() {
canvasEvents();	
resizeCanvas();
originX=document.getElementById("spiralCanvas").width*0.45;
originY=document.getElementById("spiralCanvas").height*0.5;

window.setInterval(intervalWrapper,20);
window.addEventListener('resize',resizeCanvas, false);

openDB();
	
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
function intervalWrapper() {
	document.getElementById('plotArea').height=0; 
	if (!plotting && !snapping) {
		document.getElementById('plotArea').innerHTML = "";
		drawUserSpirals();
		snapset=false; 
	}
	else if (snapping && !snapset) {
		document.getElementById("spiralCanvas").width=0;
		document.getElementById("spiralCanvas").height=0;
		document.getElementById("videoHolder").width = 400; 
		document.getElementById("videoHolder").height = 315; 
	    document.getElementById("plotArea").innerHTML = setUpSnap();
	}
	else if (plotting) {
		document.getElementById("videoHolder").width = 0; 
		document.getElementById("videoHolder").height = 0; 
		document.getElementById("spiralCanvas").width=400;
		document.getElementById("spiralCanvas").height=315;
		snapset=false; 
		getResults('spiral');
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

var RMSE; 
function spiralError() {
	 RMSE=[];	
	for (ji=0;ji<userSpiral.length;ji++) {
		RMSE.push(Math.pow(userSpiral[ji].dispFromSpiral(),1));	
	}
	var mean = RMSE.reduce((a,b) => a + b, 0) / RMSE.length;
	var std = 0;
	for (ji=0;ji<RMSE.length;ji++) 
		std = std + Math.pow(RMSE[ji]-mean,2);
	std = std / RMSE.length;
	
	//DUPLICATE CODE (in case taken out). 
	//Find origin point.
	var xorig=(userSpiral[0].xpos+userSpiral[1].xpos)/2;
	var yorig=(userSpiral[0].ypos+userSpiral[1].ypos)/2;
	
	//First reset the original point. We have done all of the reference spiral calculations at this point, so safe. 
	userSpiral[0].r=Math.sqrt(Math.pow(userSpiral[0].xpos-xorig,2)+Math.pow(userSpiral[0].ypos-yorig,2));
	userSpiral[0].theta=Math.atan2(userSpiral[0].ypos-xorig,userSpiral[0].xpos-yorig);
	
	//Calculate frequency using dft from raw x and y coordinates. 
	rads = []; for (var i=0;i<userSpiral.length-1;i++) {
		rads.push(toComplexNumber(userSpiral[i].r,userSpiral[i].theta));	
	}
	var dftResult = dft(rads);
	var mags = [];
	for (var i=0;i<dftResult.length;i++)
		mags.push(complexMagnitude(dftResult[i]));
	var maxMag = mags.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax , 0);
	var fs=(1000/getSamplesPerSec());
	fss=[]; for (i=0;i<rads.length;i++) fss.push(fs*i/rads.length);
	var freq = fss[maxMag];
	
	var ctx=document.getElementById("spiralCanvas").getContext("2d");
    ctx.strokeStyle="red";
    ctx.globalAlpha=1.0;
	ctx.beginPath();
	ctx.moveTo(10,10);
	for (ji=0;ji<RMSE.length;ji++) {
		ctx.lineTo(10+ji,10+RMSE[ji]);
	}		
	ctx.stroke();	
	
	var initResults= [(mean).toFixed(5), (Math.sqrt(std,2)).toFixed(5), freq.toFixed(5)];
	initResults=initResults.concat(calculate_drdtheta());
	initResults=initResults.concat(calculate_firstsecond());
	initResults=initResults.concat(calculate_interspiral());

	console.log("Calculated " + initResults.length + " results.");
	return(initResults);			
}

/*
This function calculates the average change in r, theta, and r/theta.
The origin is assumed to be the point between the first two points in the original spiral. 
r,theta transform is then done using that calculated point.
Delta r refers to the change in r from point i to point i+1. 
Mean is calculated at the end. 

Return: array with mean dr, dtheta, dr/dtheta
*/ 
function calculate_drdtheta() {
	//Find origin point.
	var xorig=(userSpiral[0].xpos+userSpiral[1].xpos)/2;
	var yorig=(userSpiral[0].ypos+userSpiral[1].ypos)/2;
	
	//First reset the original point. We have done all of the reference spiral calculations at this point, so safe. 
	userSpiral[0].r=Math.sqrt(Math.pow(userSpiral[0].xpos-xorig,2)+Math.pow(userSpiral[0].ypos-yorig,2));
	userSpiral[0].theta=Math.atan2(userSpiral[0].ypos-xorig,userSpiral[0].xpos-yorig);

	var mean_dr=0; var mean_dtheta=0; var mean_drdtheta =0;
	for (var i=0; i<(userSpiral.length-1); i++) {
		
		//Now calculate r,theta with respect to this point. 
		//Overwrite the existing r,theta.
		userSpiral[i+1].r=Math.sqrt(Math.pow(userSpiral[i+1].xpos-xorig,2)+Math.pow(userSpiral[i+1].ypos-yorig,2));
		userSpiral[i+1].theta=Math.atan2(userSpiral[i+1].ypos-xorig,userSpiral[i+1].xpos-yorig);
		
		//Now find the mean of the difference from i to i+1. 
		mean_dr += (userSpiral[i+1].r-userSpiral[i].r);
		var temp=(userSpiral[i+1].theta-userSpiral[i].theta); 
		mean_dtheta += temp;
		if (temp!=0) { mean_drdtheta += (userSpiral[i+1].r-userSpiral[i].r)/(userSpiral[i+1].theta-userSpiral[i].theta); }
		
		userSpiral[i].dr=(userSpiral[i+1].r-userSpiral[i].r);
		userSpiral[i].dtheta=(userSpiral[i+1].theta-userSpiral[i].theta);
	}
	return([(mean_dr/(userSpiral.length-1)).toFixed(5), (mean_dtheta/(userSpiral.length-1)).toFixed(5), (mean_drdtheta/(userSpiral.length-1)).toFixed(5)]); 
}

/* To be called after calculate_drdtheta.
Since we have dr, dtheta for the spiral itself at this point, we can calculate first and second order smoothness and zero crossing.

All from 8.9.11.SpiralManual. 

RMS = sqrt( ( sum over N of dr^2 ) / N-2 )

first order smooth = natural log [ 1/total spiral angle * sum ( (dr/dtheta - RMS)^2 ) ]

second order smooth relies on the derivative of the RMS
derivative of RMS: 
since RMS = sqrt( sum ( dr)^2 ) / (n - 2) )
deriv = 1/2 * (  (2 * sum (dr)) / (n-2)  )^-1/2

second order smooth = natural log [ 1/total spiral angle* sum( (change in dr/dtheta)/dtheta - drms)^2 ]

derivative of RMS dr/dtheta:
since RMS_drdtheta = sqrt( sum ( (dr/dtheta)^2 ) / (n-2) )
deriv = 1/2 * ( (2 * sum (dr/dtheta)) / (n-2))^-1/2

Return: array with RMS of r, first smooth, second smooth, first zero-cross, second zero-cross. 
*/
function calculate_firstsecond() {
	var rms=0; var firstSmooth = 0; var drms = 0; var secondSmooth = 0; 
	
	//First calculate the rms value. Will be used for other calculations. 
	for (var i=0; i<userSpiral.length-1; i++) {
		rms += userSpiral[i].dr^2; 
		drms += userSpiral[i].dr; 
	}
	rms = Math.sqrt((rms/(userSpiral.length-2))); 
	drms = 0.5 * Math.sqrt( 2 * drms / (userSpiral.length-2));
	
	//Now calculate first order smoothness. 
	for (var i=0; i<userSpiral.length-1; i++) {
		if (userSpiral[i].dtheta!=0) {
			firstSmooth += (userSpiral[i].dr/userSpiral[i].dtheta - rms)^2; 
		}
	}
	firstSmooth = Math.log(firstSmooth*1/6.28319); // 360 degrees in radians
	
	//Now calculate second order smoothness. 
	for (var i=0; i<userSpiral.length-2; i++) {
		if (userSpiral[i].dtheta*userSpiral[i+1].dtheta!=0) {
			var ddrdtheta = userSpiral[i].dr/userSpiral[i].dtheta - userSpiral[i+1].dr/userSpiral[i+1].dtheta; 
			secondSmooth += (ddrdtheta/userSpiral[i].dtheta - drms)^2;
		}
	}
	secondSmooth = Math.log(secondSmooth^2*1/6.28319);
	
	//Now calculate first order zero crossing. 
	//First calculate the root mean square of dr/dtheta.
	var rms_drdtheta = 0;
	for (var i=0; i<userSpiral.length; i++) {
		if (userSpiral[i].dtheta!=0) rms_drdtheta += (userSpiral[i].dr/userSpiral[i].dtheta)^2; 
	}
	rms_drdtheta = Math.sqrt(rms_drdtheta/(userSpiral.length-2));
	//Then calculate the crossings.
	var firstCrossing = 0; 
	for (var i=0; i<userSpiral.length-2; i++) {
		if (userSpiral[i+1].dtheta*userSpiral[i].dtheta!=0) {
			var a = Math.sign( userSpiral[i+1].dr/userSpiral[i+1].dtheta - rms_drdtheta );
			var b = Math.sign( userSpiral[i].dr/userSpiral[i].dtheta - rms_drdtheta );
			firstCrossing += (a-b);
		}
	}
	firstCrossing = (firstCrossing / 2 / (userSpiral.length-1)) * 100;
	
	//Now calculate second order crossing.
	//First calculate the derivative of rms_drdtheta.
	var drms_drdtheta = 0;
	for (var i=0; i<userSpiral.length-1; i++) {
		if (userSpiral[i].dtheta!=0) drms_drdtheta += (userSpiral[i].dr/userSpiral[i].dtheta); 
	}
	drms_drdtheta = 0.5 * Math.sqrt( 2*drms_drdtheta / (userSpiral.length-2) ); 
		
	var secondCrossing = 0; 
	for (var i=0; i<userSpiral.length-3; i++) {
		if (userSpiral[i].dtheta*userSpiral[i+1].dtheta*userSpiral[i+2].dtheta!=0) {
		var a = userSpiral[i].dr/userSpiral[i].dtheta - userSpiral[i+1].dr/userSpiral[i+1].dtheta;
		var b = userSpiral[i+1].dr/userSpiral[i+1].dtheta - userSpiral[i+2].dr/userSpiral[i+2].dtheta;	
		a=a/userSpiral[i].dtheta;
		b=b/userSpiral[i+1].dtheta;
		secondCrossing += ( Math.sign(a-drms_drdtheta) - Math.sign(b-drms_drdtheta) );
		}
	}
	secondCrossing = (secondCrossing / 2 / (userSpiral.length-1)) * 100;
	
	return([rms.toFixed(5), firstSmooth.toFixed(5),secondSmooth.toFixed(5),firstCrossing.toFixed(5), secondCrossing.toFixed(5)]);
}

/* 
Calculate the distance between spiral points at same angle.

Done because the points user entered are in ascending order of r.
First identify all possible unique values of theta. 
Then group points by theta value.
Finally, calculate difference between consecutive points in each group. 
Then take the mean of all of them.

Return: mean interspiral interval. 
*/
function calculate_interspiral() {
	//Set up a map of arrays to keep all unique degree values.
	var degreeR = new Map();
	for (var i=0; i<=360; i++) {
		degreeR[i]=[];
	}
	//Now loop through every point and put it into its group.
	for (var i=0; i<userSpiral.length;i++) {
		//Convert theta from radian to degree.
		var res=0; 
		//Fix it so that anything in the quandrants below x-axis are + PI.
		if (userSpiral[i].theta<0) {
			res=(Math.PI+userSpiral[i].theta)+Math.PI; 
		}
		else { 
			res=userSpiral[i].theta;
		}
		res = Math.round( res * 180 / Math.PI);
		degreeR[res].push(userSpiral[i].r);	
	}
	
	//Now loop through entire map and gather interspiral interval values;
	userSpiral.interspiralMeans = []; 
	for (var k in degreeR) {
		var mean=0; var count=0; 
		if (degreeR[k].length>1) {
			for (var j=0; j<degreeR[k].length-1;j++) {
				mean+=degreeR[k][j+1]-degreeR[k][j];
			}
			count=count+1;	
			mean=mean/count; 
			userSpiral.interspiralMeans.push(mean);
		}
	}
	
	//Now get the mean of means.
	mm=((userSpiral.interspiralMeans.reduce((a, b) => a + b) / userSpiral.interspiralMeans.length).toFixed(5));
	//Now calculate the standard deviation. 
	sd=Math.sqrt(userSpiral.interspiralMeans.reduce((a,b) => a + (b-mm)^2) / userSpiral.interspiralMeans.length).toFixed(5);
	return([mm,sd]);
}

/* 
	Set up string to save the results.  
	To be called after the results have been analyzed. 

	Get the results from the error bar. 
	Append first the info in the Patient ID bar, 
	then results, 
	then the x y of all spiral points.
	
	Return: none
	(send results via email)
*/ 
function emailResultString() {
	var res=document.getElementById('userInfo').value;
	res += " ";
	res += document.getElementById('resultsBarText').value; 
	res += " ";
	var spirPoints="";
	for (var i=0; i<userSpiral.length; i++) {
		spirPoints += userSpiral[i].xpos + " " + userSpiral[i].ypos + " ";
	}
	res += spirPoints;
	
	alert(res);
	
	//Now send the email.
	Email.send({
		SecureToken: "f9eac347-0287-4e9a-88f0-bb9cedd30f44",
		To: "digitalspiralproject.skmc@gmail.com",
		From: "digitalspiralproject.skmc@gmail.com",
		Subject: document.getElementById('userInfo').value,
		Body: res,
		}).then(message => console.log(message)).catch(e => console.log(e));
}

function getSamplesPerSec() {
	if (sampleRate != undefined) 
		return(sampleRate);
	
	var startTime = userSpiral[0].time;
	var currTime = userSpiral[0].time;
	var i;
	for (i=1;i<userSpiral.length;i++) {
		if (userSpiral[i].time - startTime > 1000) 
			break;
	}
	return(i);
}

//Get the results of analysis and place it in the appropriate textbox. 
function analyzeSpiral() {
	analyzed = true;
	var print = "";
	var error = spiralError(); 
	document.getElementById("resultsBarText").value = "RMS=" + error[0] + "±" + error[1] + " " + error[2] + " Hz=" + 
		" mean_dr=" + error[3] + " mean_theta=" + error[4] + " mean_dr/dtheta=" + error[5] + 
		" RMSself=" + error[6] + " 1S=" + error[7] + " 2S=" + error[8] + " 1X=" + error[9] + " 2X=" + error[10] + "" +
		" ISI=" + error[11] + "±" + error[12];
}

//Draw the template spiral that users can trace from. 
function drawBGSpiral() {

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

//Clear the entire canvas by painting a white rectangle over the entire thing. Also clear the arrays that hold the background spirals. 
function clearCanvas() {
	var cv=document.getElementById("spiralCanvas");
	var ctx=cv.getContext("2d");
	ctx.fillStyle="white";
	ctx.globalAlpha=1.0; 
	ctx.fillRect(0,0,cv.width,cv.height);
	lhSpiral = [];
	rhSpiral = [];
	drawSpiral = [];
}

//Clear all of the available spiral data, including analysis, and clear the canvas. 
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
		document.getElementById('hand').src='./img/right.jpg';
	}
	else {
		currentHand = "L"; 
		document.getElementById('hand').src='./img/left.jpg';
	}
}

function toggleSpiral() {
	drawBackgroundSpiral++;
	if (drawBackgroundSpiral > 5) {
		drawBackgroundSpiral = 0; 
	}
	clearCanvas();
	drawBGSpiral();
	snapset=false; 
	snapping=false;
}

function resizeCanvas() {
	document.getElementById("spiralCanvas").width = 400;
	document.getElementById("spiralCanvas").height = 315;
	clearCanvas();		
}// JavaScript Document

function snapSpiral() {
	snapping=!snapping; 
	plotting=false;
}