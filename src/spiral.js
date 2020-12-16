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

    ctx.fillStyle = "black";
    if (chance>1) { ctx.fillStyle="red"; }
    ctx.font='16px serif';
    ctx.fontWeight="bold";
		ctx.fillText("Chance spiral is abnormal = " + chance,5,15);

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
	for (i=0;i<200;i++) {
		var angle=0.1*i;
		x=(angleMod*angle)*Math.cos(angle);
		y=(angleMod*angle)*Math.sin(angle);
		lhSpiral.push(new spiralPoint(x+originX,y+originY,0));
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
		lhSpiral.push(new spiralPoint(x+originX,y+originY,0));
		ctx.lineTo(x+originX,y+originY);
	}	
	ctx.stroke();
	drawSpiral=lhSpiral; 
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

function toggleSpiral() {
	drawBackgroundSpiral++;
	if (drawBackgroundSpiral > 5) {
		drawBackgroundSpiral = 0; 
	}
	
	learnedSpirals[3] = [];
  learnedSpirals[3][0]=[0.789238608608612,0.483007217217216,5.16580518518518,2.92031301301301,9.26577931931932,48.9448683683684,4.09681077077075,30.5260033133134,0.191283213213213,0.160835925925926];
learnedSpirals[3][1]=[0.789644224224228,0.701139039039039,92.1282656056057,15.1044991491491,12.0627794294294,53.2513529329329,2.171016006006,28.1952805305306,0.19579018018018,0.169673383383383];
learnedSpirals[3][2]=[0.789334384384389,0.793984104104105,4.85080487487487,7.7921986086086,9.98959742742743,50.3138837237237,2.39586402402402,27.5041370370371,0.185644704704705,0.15983976976977];
learnedSpirals[3][3]=[0.790351431431435,0.859016526526526,3.84680139139139,8.55433130130131,9.27440380380381,48.2971118618618,3.67125973973972,27.6769228428429,0.190944544544545,0.158351041041041];
learnedSpirals[3][4]=[0.672786126126127,0.745824574574574,57.2086543043044,17.0931033933934,12.5738134334334,55.1991560960961,1.74068618618619,28.5735477277277,0.175864934934935,0.136424064064064];
learnedSpirals[3][5]=[0.548196796796796,1.59381118118118,92.4918200800801,25.674023993994,13.817165015015,58.7559766866866,2.10512088088088,22.6284068168168,0.16847017017017,0.121773303303303];
learnedSpirals[3][6]=[0.690783933933934,1.25906690690691,-38.4312163963963,12.6162544444444,12.9906418718719,57.7035101701702,2.11794786786787,22.547673013013,0.181673973973974,0.141375615615616];
learnedSpirals[3][7]=[0.65759948948949,1.26035084084084,71.3636963563563,12.5886557257257,12.9752215215215,57.6322574274274,2.20673007007007,22.4292137637637,0.181429649649649,0.141188838838839];
learnedSpirals[3][8]=[0.7354990990991,0.810852492492493,-60.5072285185185,7.3152212012012,11.8983111711712,55.6659522722723,2.363671001001,29.3685645245246,0.178624754754755,0.149608368368368];
learnedSpirals[3][9]=[0.845771901901901,0.79484102102102,51.6474404304304,7.29846992992992,12.1606891691692,56.3796146346347,2.46251347347347,27.5069035535536,0.174735355355355,0.140887467467467];
	
	clearCanvas();
	drawBGSpiral();
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