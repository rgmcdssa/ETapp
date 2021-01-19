/*An implementation of atan that gives degrees as output.
  Gives degrees 0-90, 90-180, 180-270, 270-360 ascending for quadrants 1-4.

Return: angle of vector in degrees.
*/
function atanRotate(x,y) {
	if (x<0&&y>0) {
		return(90+Math.atan2(-1*x,y)*180/Math.PI);
	}
	else if (x<0&&y<0) {
		return(180+Math.atan2(-1*y,-1*x)*180/Math.PI);
	}
	else if (x>0&&y<0) {
		return(270+Math.atan2(x,-1*y)*180/Math.PI);
	}
	else {
		return(Math.atan2(y,x)*180/Math.PI); 
	}
}

/* 
	Main function to calculate all spiral errors.
	
	Calculates:
	- RMSE as root mean square error from target spiral
	- mean dr, dtheta, dr/dtheta for spiral vs. self as rates of change in coordinates
	- 1/2S and 1/2X metrics from Pullman
	- interspiral interval from Louis
	- tremor frequency...

Return: none
	(prints results to error bar)
*/
var RMSE; 
function spiralError(decs,printable=1,extended=0) {
	//Handle conversion to r,theta coordinates once. 
	toPolarCoordinates(userSpiral); 
	if (drawSpiral.length>0) { toPolarCoordinates(drawSpiral); }

  if (drawSpiral.length>0) {
	  //If freehand spiral, find the right size of background and use that as a target. 
	  if (drawBackgroundSpiral == 0) {
      drawBackgroundSpiral = findSpiralSize(userSpiral); 
      newBackgroundSpiral = 1;
      drawBGSpiral(); 
      console.log(drawBackgroundSpiral);
	  }

	//Calculate displacement from background ideal spiral, unless not using. 
	//Do this using the linear graph of r vs. theta. 
		RMSE=[];	
		for (ji=0;ji<userSpiral.length;ji++) {
			RMSE.push(Math.pow(userSpiral[ji].dispFromSpiral(),1));	
		}
		var mean = RMSE.reduce((a,b) => a + b, 0) / RMSE.length;
		var std = 0;
		for (ji=0;ji<RMSE.length;ji++) 
			std = std + Math.pow(RMSE[ji]-mean,2);
		std = std / RMSE.length;
	
		//Draw lines from every point to nearest one on target spiral. 
		var ctx=document.getElementById("spiralCanvas").getContext("2d");
    	ctx.strokeStyle="red";
   		 ctx.globalAlpha=1.0;
		ctx.beginPath();
		ctx.moveTo(10,10);
		for (ji=0;ji<RMSE.length;ji++) {
			ctx.lineTo(10+ji,10+RMSE[ji]);
		}		
		ctx.stroke();
  }
  else {
    var mean=0; var std=0;
  }
	//Calculate frequency using dft from raw polar coordinates. 
	rads = []; for (var i=0;i<userSpiral.length-1;i++) {
		/*var aa = userSpiral[i].r - userSpiral[i+1].r; 
		var bb = userSpiral[i].time - userSpiral[i+1].time;
		if (aa*bb!=0)
			rads.push(toComplexNumber(aa/bb,aa/bb));	*/
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
	
	var initResults= [(mean).toFixed(decs), (Math.sqrt(std,2)).toFixed(decs), freq.toFixed(decs)];
	initResults=initResults.concat(calculate_drdtheta(decs));
	initResults=initResults.concat(calculate_firstsecond(decs));
	initResults=initResults.concat(calculate_interspiral(decs));

	//console.log("Calculated " + initResults.length + " results.");
	if (!printable) {
	  initResults = initResults.reduce((a,i)=> a + " " + i);
	  initResults = initResults.replace(/±/g," ");
	  initResults = initResults.split(" ");
	}
	
	//If extending, add newer metrics.
	if (extended) {
	  initResults=initResults.concat(calculate_accel(decs));
	  if (drawBackgroundSpiral > 0) { initResults=initResults.concat(calculate_auc()); }
	}
	
	return(initResults);			
}

function toRadian(a) {
	return(a*Math.PI/180);
}
function toDegree(a) {
	return(a*180/Math.PI);
}

/* Function to get polar coordinates of each spiral point.
   Do this once.
   Based on ideal formulas. 
   Important: theta output in degrees from base function. Convert back to radians prior to storing, to
   be consistent with original Pullman papers.
 
Input: none - using existing userSpiral.
Return: none - stored in spiralPoint.
*/
function toPolarCoordinates(inpt) {
	//Find origin point.
	var xorig=(inpt[0].xpos+inpt[1].xpos)/2;
	var yorig=(inpt[0].ypos+inpt[1].ypos)/2;
		
	//First reset the original point. We have done all of the reference spiral calculations at this point, so safe. 
	inpt[0].r=Math.sqrt(Math.pow(inpt[0].xpos-xorig,2)+Math.pow(inpt[0].ypos-yorig,2));
	//Compute theta, but adjust for the preceding point so that theta is always positively increasing. 
	inpt[0].theta=atanRotate(inpt[0].ypos-yorig,inpt[0].xpos-xorig);
	
	//Now do this for all spiral points.
	var pre=inpt[0].theta; 
	var zeroCrossing = 0; 
	for (var i=1; i<inpt.length;i++) {
		inpt[i].r=Math.sqrt(Math.pow(inpt[i].xpos-xorig,2)+Math.pow(inpt[i].ypos-yorig,2));
		
		var tmp=atanRotate(inpt[i].xpos-xorig,inpt[i].ypos-yorig)+360*(zeroCrossing-1);
		if (tmp<pre) {
			//Hit a point where we cross back over x=1,y=0. Need to add 360 degrees.
			zeroCrossing++;
		}
		inpt[i].theta = tmp; 
		pre=tmp; 
	}
	
	//Now convert back to radians.
	for (var i=0; i<inpt.length; i++) {
		inpt[i].theta=toRadian(inpt[i].theta);
	}
}

/*
This function calculates the average change in r, theta, and r/theta.
The origin is assumed to be the point between the first two points in the original spiral. 
r,theta transform is then done using that calculated point.
Delta r refers to the change in r from point i to point i+1. 
Mean is calculated at the end. 

Return: array with mean dr, dtheta, dr/dtheta, dr/dtime, as well as standard deviations
*/ 
function calculate_drdtheta(decs) {

	var pre=-10000; 
	var mean_dr=0; var mean_dtheta=0; var mean_drdtheta =0; var mean_drdtime = 0; 
	for (var i=0; i<(userSpiral.length-1); i++) {
		
		//Now find the mean of the difference from i to i+1. 
		mean_dr += (userSpiral[i+1].r-userSpiral[i].r);
		var temp=(userSpiral[i+1].theta-userSpiral[i].theta); 
		mean_dtheta += temp;
		if (temp!=0) { mean_drdtheta += (userSpiral[i+1].r-userSpiral[i].r)/(userSpiral[i+1].theta-userSpiral[i].theta); }
		temp=(userSpiral[i+1].time-userSpiral[i].time); 
		if (temp!=0) { mean_drdtime += (userSpiral[i+1].r-userSpiral[i].r)/temp; }
		
		userSpiral[i].dr=(userSpiral[i+1].r-userSpiral[i].r);
		userSpiral[i].dtheta=(userSpiral[i+1].theta-userSpiral[i].theta);
		if (temp!=0) 
			userSpiral[i].drdtime=(userSpiral[i+1].dr)/temp;
		else
			userSpiral[i].drdtime=0; 
	}

	var res = ([(mean_dr/(userSpiral.length-1)).toFixed(decs) + "", 
	(mean_dtheta/(userSpiral.length-1)).toFixed(decs), 
	(mean_drdtheta/(userSpiral.length-1)).toFixed(decs), 
	(mean_drdtime/(userSpiral.length-1)).toFixed(decs)]); 
	
	var sdev=[0,0,0,0];
	for (var i=0; i<(userSpiral.length-1); i++) {
		sdev[0] += Math.pow(userSpiral[i+1].r-userSpiral[i].r-res[0],2);
		var temp=(userSpiral[i+1].theta-userSpiral[i].theta); 
		sdev[1] += Math.pow(temp - res[1],2);
		if (temp!=0)
			sdev[2] += Math.pow((userSpiral[i+1].r-userSpiral[i].r)/(userSpiral[i+1].theta-userSpiral[i].theta) - res[2],2);
		temp=(userSpiral[i+1].time-userSpiral[i].time); 
		if (temp!=0) { sdev[3] += Math.pow((userSpiral[i+1].r-userSpiral[i].r)/temp - res[3],2); }
	}
	
	for (var i=0; i<4; i++)
		sdev[i] /= (userSpiral.length-1);
		
	return ([res[0] + "±" + Math.sqrt(sdev[0]).toFixed(decs),
		res[1] + "±" + Math.sqrt(sdev[1]).toFixed(decs),
		res[2] + "±" + Math.sqrt(sdev[2]).toFixed(decs),
		res[3] + "±" + Math.sqrt(sdev[3]).toFixed(decs),
	]);
}

/* Calculate the acceleration, or rate of change of the velocity.
   Basically calculate dr / dt, then calculate the rate of change of that. */
function calculate_accel(decs) {
    var drdt = []; var tmp = 0;
  	for (var i=0; i<(userSpiral.length-1); i++) {
  	  tmp = (userSpiral[i+1].time-userSpiral[i].time);
  	  if (tmp<1) { tmp =1; }
  	  drdt.push((userSpiral[i+1].r-userSpiral[i].r) / tmp);
  	}
  	
  	var mean_ddrddt = 0; var sd_ddrddt = 0;
  	for (var i=0; i<drdt.length-1; i++) {
  	  mean_ddrddt += (drdt[i+1] - drdt[i]);
  	}
  	mean_ddrddt=mean_ddrddt/drdt.length;
  	for (var i=0; i<drdt.length-1; i++) {
  	  sd_ddrddt += Math.pow(((drdt[i+1] - drdt[i]) - mean_ddrddt),2);
  	}
  	sd_ddrddt = Math.sqrt(sd_ddrddt/drdt.length); 
  	return([mean_ddrddt.toFixed(decs),sd_ddrddt.toFixed(decs)]);
}

//New AUC function. 
function calculate_auc(trim=5) {
  //Calculate slope of line r vs. index
  //First shift everything to the origin.
  var data = [];
  for (var i=0; i<userSpiral.length; i++) {
    data.push(parseFloat((userSpiral[i].r-userSpiral[0].r).toFixed(2)));
  }
  
  //To find slope, us mean of first few and last few points. 
  var start = data.slice(0,trim).reduce((a,b)=>a+b)/trim; 
  var end = data.slice(data.length-trim,data.length).reduce((a,b)=>a+b)/trim; 
  var slope = (end-start)/data.length; 
  //var slope = (data[data.length-1] - data[0])/data.length;

  //We don't know how far each point stretches on the x axis.
  //Angles are unreliable.
  //So just sum the mod. 
  var auc = 0;
  for (var i=1; i<data.length-trim; i++) {
    //auc += Math.abs(data[i] - (data[0]+slope*i))/(data[0]+slope*i);
    //auc += ((data[i]-start)%slope)/slope;
    //Try just summing absolute difference between r of closest point by angle.
    var mind = 0; var min=1000000; 
    for (var j=0; j<drawSpiral.length; j++) {
      if (min > Math.abs(drawSpiral[j].theta - userSpiral[i].theta)) {
        min =  Math.abs(drawSpiral[j].theta - userSpiral[i].theta); mind=j; 
      }
    }
    auc += Math.abs(drawSpiral[mind].r - data[i]);///Math.abs(drawSpiral[mind].r);
  }
  
  return(auc);
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
function calculate_firstsecond(decs) {
	var rms=0; var firstSmooth = 0; var drms = 0; var secondSmooth = 0; 
	
	//First calculate the rms value. Will be used for other calculations. 
	for (var i=0; i<userSpiral.length-1; i++) {
		rms += Math.pow(userSpiral[i].dr,2); 
		drms += userSpiral[i].dr; 
	}
	rms = Math.sqrt((rms/(userSpiral.length-2))); 
	drms = 0.5 * Math.sqrt( 2 * drms / (userSpiral.length-2));
	
	//Now calculate first order smoothness. 
	for (var i=0; i<userSpiral.length-1; i++) {
		if (userSpiral[i].dtheta!=0) {
			firstSmooth = firstSmooth + Math.pow(userSpiral[i].dr/userSpiral[i].dtheta - rms,2); 
		}
	}
	firstSmooth = Math.log(firstSmooth*1/360);//6.28319); // 360 degrees in radians
	
	//Now calculate second order smoothness. 
	for (var i=0; i<userSpiral.length-2; i++) {
		if (userSpiral[i].dtheta*userSpiral[i+1].dtheta!=0) {
			var ddrdtheta = userSpiral[i+1].dr/userSpiral[i+1].dtheta - userSpiral[i].dr/userSpiral[i].dtheta; 
			secondSmooth += Math.pow(ddrdtheta/userSpiral[i].dtheta - drms,2);
		}
	}
	secondSmooth = Math.log(Math.pow(secondSmooth,2)*1/360);//6.28319);
	
	//Now calculate first order zero crossing. 
	//First calculate the root mean square of dr/dtheta.
	var rms_drdtheta = 0;
	for (var i=0; i<userSpiral.length-1; i++) {
		if (userSpiral[i].dtheta!=0) {
			rms_drdtheta += Math.pow(userSpiral[i].dr/userSpiral[i].dtheta,2); 
		}
	}
	rms_drdtheta = Math.sqrt(rms_drdtheta/(userSpiral.length-2));
	
	//Then calculate the crossings.
	var firstCrossing = 0; 
	for (var i=0; i<userSpiral.length-2; i++) {
		if (userSpiral[i+1].dtheta*userSpiral[i].dtheta!=0) {
			var a = Math.sign( userSpiral[i+1].dr/userSpiral[i+1].dtheta - rms_drdtheta );
			var b = Math.sign( userSpiral[i].dr/userSpiral[i].dtheta- rms_drdtheta );
			/*firstCrossing += (a-b); -- from doc, but think this is wrong; wouldn't accumulate zero crossings but count them against each other*/
			firstCrossing += (Math.abs(a-b)>1?1:0);
		}
	}
	firstCrossing = (firstCrossing / 2 / (userSpiral.length-1)) * 100;
	
	//Now calculate second order crossing.
	//First calculate the derivative of rms_drdtheta.
	var drms_drdtheta = 0;
	for (var i=0; i<userSpiral.length-2; i++) {
		if (userSpiral[i].dtheta!=0) 
			drms_drdtheta += Math.abs(userSpiral[i].dr/userSpiral[i].dtheta); 
			//fix error where negative changes in angle affect results
	}
	drms_drdtheta = 0.5 * Math.sqrt( 2*drms_drdtheta / (userSpiral.length-2) ); 
		
	var secondCrossing = 0; 
	for (var i=0; i<userSpiral.length-3; i++) {
		if (userSpiral[i].dtheta*userSpiral[i+1].dtheta*userSpiral[i+2].dtheta!=0) {
		var a = userSpiral[i+1].dr/userSpiral[i+1].dtheta - userSpiral[i].dr/userSpiral[i].dtheta;
		var b = userSpiral[i+2].dr/userSpiral[i+2].dtheta - userSpiral[i+1].dr/userSpiral[i+1].dtheta;	
		a=a/userSpiral[i].dtheta;
		b=b/userSpiral[i+1].dtheta;
		secondCrossing += ( Math.abs(( Math.sign(a-drms_drdtheta) - Math.sign(b-drms_drdtheta) )) > 1 ? 1 : 0);
		}
	}
	secondCrossing = (secondCrossing / 2 / (userSpiral.length-1)) * 100;
	
	return([rms.toFixed(decs), firstSmooth.toFixed(decs),secondSmooth.toFixed(decs),firstCrossing.toFixed(decs), secondCrossing.toFixed(decs)]);
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
function calculate_interspiral(decs) {
	//Set up a map of arrays to keep all unique degree values.
	var degreeR = new Map();
	for (var i=0; i<=360; i++) {
		degreeR[i]=[];
	}
	//Now loop through every point and put it into its group.
	for (var i=0; i<userSpiral.length;i++) {
		//Convert theta from radian to degree.
		var res=0; 
		//Fix it so that anything in the quadrants below x-axis are + PI.
		if (userSpiral[i].theta<0) {
			res=(Math.PI+userSpiral[i].theta)+Math.PI; 
		}
		else { 
			res=userSpiral[i].theta;
		}
		//Because this is a linear transform, mod theta so we can convert back to 0 to 360 degrees. 
		res = Math.round(((Math.abs(res) %(Math.PI*2)) * 180 / Math.PI));
		degreeR[res].push(userSpiral[i].r);	
	}
	
	//Now loop through entire map and gather interspiral interval values;
	//Implement this value as std dev / mean per Louis 2012. 
	userSpiral.interspiralMeans = []; 
	for (var k in degreeR) {
		var mean=0; var stdev=0; var count=0; 
		if (degreeR[k].length>0) {
			mean=(degreeR[k].reduce((a, b) => a + b) / degreeR[k].length);
			stdev = Math.sqrt(degreeR[k].reduce((a, b) => a + Math.pow(b-mean,2)) / degreeR[k].length);
			if (mean!=0) { userSpiral.interspiralMeans.push(stdev/mean); } 
		}
	}
	
	//Now get the mean of means.
	mm=((userSpiral.interspiralMeans.reduce((a, b) => a + b) / userSpiral.interspiralMeans.length).toFixed(decs));
	//Now calculate the standard deviation. 
	sd=Math.sqrt(userSpiral.interspiralMeans.reduce((a,b) => a + Math.pow(b-mm,2)) / userSpiral.interspiralMeans.length).toFixed(decs);
	//console.log(mm+" "+sd);
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
function procResultStringForEmail() {
	//Making this so code isnt duplicated.
	var error = spiralError(5); 
	
	var res=document.getElementById('userInfo').value;
	res += " ";
	res += "RMS=" + error[0] + "±" + error[1] + " " + error[2] + " Hz=" + 
		" mean_dr=" + error[3] + " mean_theta=" + error[4] + " mean_dr/dtheta=" + error[5] + " mean_dr/dtime=" + error[6] + 
		" RMSself=" + error[7] + " 1S=" + error[8] + " 2S=" + error[9] + " 1X=" + error[10] + "% 2X=" + error[11] + "%" +
		" ISI=" + error[12] + "±" + error[13]; 
	return(res);
}
function emailResultString() {
	//First grab result string and store it in res. 
	var res = procResultStringForEmail();
	res += " ";
	var spirPoints="";
	for (var i=0; i<userSpiral.length; i++) {
		spirPoints += userSpiral[i].xpos + " " + userSpiral[i].ypos + " ";
	}
	res += spirPoints;
	
	alert('Email sent.');
	
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

function printConsole(s) {
	console.log(s.join("\t"));
}

// calculate Euclidean distance between vectors
// d = sqrt( sum( a-b^2 ) )
function euclidDist(a,b) {
  var diff=(a.map((a,i) => (a-b[i])*(a-b[i])));
  return(Math.sqrt(diff.reduce((acc,v) => acc + v)));
}

// calculate Euclidean distance between vectors, BUT normalize to target vector first
// d = sqrt( sum( a-b^2 ) )
function euclidDistNorm(a,b) {
  var diff=(a.map((a,i) => (a/b[i])));
  diff=(diff.map((a,i) => (1-a)*(1-a)));
  return(Math.sqrt(diff.reduce((acc,v) => acc + v)));
}

// calculate Euclidean distance between vectors, BUT weight values first
// d = sqrt( sum( a-b^2 ) )
function euclidDistWeight(a,b,c) {
  var a1=(a.map((a,i) => (a*c[i])));
  var b1=(b.map((b,i) => (b*c[i])));
  var diff=(a1.map((a1,i) => (a1-b1[i])*(a1-b1[i])));
  return(Math.sqrt(diff.reduce((acc,v) => acc + v)));
}

function getModelCentroid(ind) {
  var res=[];
  for (var i=0; i<learnedSpirals[0][ind].length; i++) {
    res.push(0);
  }
  for (var i=0; i<learnedSpirals.length; i++) {
    for (var j=0; j<learnedSpirals[i][ind].length; j++) {
      res[j] += parseFloat(learnedSpirals[i][ind][j]);
    }
  }
  for (var i=0; i<res.length; i++) {
    res[i] = res[i]/learnedSpirals.length;
  }
  return(res);
}

//Check spiral metrics vs. simulated noise. 
function checkLearnedSpiral(arg,extended=0,linear=0) {
  
  var ctrls=[]; var s=[]; var mindi=[]; var minInds = [];
  /*console.log(toKeep);
  for (var bg=0; bg<learnedSpirals.length; bg++) {
    ctrl=(euclidDistWeight(forControl.map(k => arg[k]),forControl.map(k => learnedSpirals[bg][0][k]),weightVector));
    ctrls.push(ctrl);
    s.push(ctrl);
  }*/
  for (var i=0; i<spiralBounds.length; i++) {
    ctrls.push(Math.abs(spiralBounds[i]-boundArea(userSpiral)));
    s.push(Math.abs(spiralBounds[i]-boundArea(userSpiral)));
  }
  s.sort(function(a, b){return a-b});
  var minInds = []; 
  //If drawing against a template, always start with that size. 
  if (drawBackgroundSpiral>0) { minInds.push(drawBackgroundSpiral/0.25); }
  for (var i=0; i<5; i++) {
    minInds.push(ctrls.indexOf(s[i]));
  }
  
    //If we're just checking the linear score, use distance from the background spiral of appropriate size as the only number. 
  if (linear == 1 && drawBackgroundSpiral > 0) {
    var toKeep = [4,5,10,11,19];
    var weightVector=[1,1,1,1,1,1,1,1];
    var res = []; 
    //Only use the template size. 
    for (var i=0; i<(drawBackgroundSpiral>0?1:minInds.length); i++) { 
      var p1=((euclidDistWeight(toKeep.map(k => arg[k]),toKeep.map(k => perfSpirals[minInds[i]][k]),weightVector)).toFixed(2));
      var p2=(euclidDistWeight(toKeep.map(k=> perfSpirals[minInds[i]][k]),toKeep.map(k => learnedSpirals[minInds[i]][0][k]),weightVector)).toFixed(2);
      var p3=(euclidDistWeight(toKeep.map(k=> arg[k]),toKeep.map(k => learnedSpirals[minInds[i]][0][k]),weightVector)).toFixed(2);
      console.log(p1+" "+p2+" "+p3); 
      res.push(p1/p2);
    }
    return (res);
  }
  
  //Get rid of standard deviations basically. 
  var forControl = [3,5,7,9,11,12,13,14,15,16,17];
  var toKeep = [3,5,7,9,11,12,13,14,15,16,17];
  var weightVector = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
  
  if (extended==1) { toKeep=toKeep.concat([18,19]);console.log("extended"); }


  var check=[]; var minds = []; var ds=[];  
  for (var bg=0; bg<minInds.length; bg++) {
  ctrl=(euclidDistWeight(toKeep.map(k => arg[k]),toKeep.map(k => learnedSpirals[minInds[bg]][0][k]),weightVector));
  var mind=1000000; var d=0; var mi=-1; 
  //Distance to control center. 
  for (var i=1; i<learnedSpirals[minInds[bg]].length; i++) {
    //Distance to noise center. 
    d=euclidDistWeight(toKeep.map(k => arg[k]),toKeep.map(k => learnedSpirals[minInds[bg]][i][k]),weightVector);
    //Keep the minimum difference between control and noise. 
    ds.push(d);
    if (d<mind) { mind=d; mi=i;}
  }
  mindi.push(mi);
  minds.push((ctrl/mind).toFixed(2));
  }
  
  return(minds.sort(function(a, b){return a-b}));
}

//Get the results of analysis and place it in the appropriate textbox. 
function analyzeSpiral() {
  
  //Trim the last few points from the spiral, to avoid artifacts related to slowing as the 
	//task finishes or lifting their finger off the page too slowly.
	//Arbitrarily chose 5. 
	for (var i=0; i<5; i++) {
	  userSpiral.pop(); 
	}
  
	analyzed = !analyzed;
	analyzing= !analyzing; 
	
	if (analyzed && analyzing) {
	var print = "";
	//printConsole(error);
	printConsole(['Chance spiral is abnormal = ',checkLearnedSpiral(spiralError(12,0,1))]);
	printConsole(['Chance spiral is abnormal = ',checkLearnedSpiral(spiralError(12,0,1),1)]);
	if (drawBackgroundSpiral > 0) { printConsole(['AUC = ',calculate_auc()]); }
	}
	
	flag=true;
}
