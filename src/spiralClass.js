class spiralPoint {

	constructor(xx,yy,tt,ii) {
		this.spiralPointColor="#0000FF";
		this.pointSize=1;
	
		this.xpos=xx;
		this.ypos=yy;
		this.time=tt;
		
		this.index = ii; 
		this.targetIndex = -1; 
	
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
		var minDist=1000000;var mini=0;
		var ctx=document.getElementById("spiralCanvas").getContext("2d");
		ctx.strokeStyle="red";
		ctx.beginPath();
		ctx.moveTo(this.xpos,this.ypos);
		//Start looking for a matching point only above the index of the point found previously. 
		var start = 0;
		//if (this.index > 0) { start = userSpiral[this.index-1].targetIndex+1; } 
		//if (start == 200) { start = 199; }
		for (i=start;i<200;i++) {
			var cDist=this.euclidDistance(drawSpiral[i]);
			if (cDist<minDist) {
				minDist=cDist;	
				mini=i;
			}
		}	
		this.targetIndex = mini; 
		ctx.lineTo(drawSpiral[mini].xpos,drawSpiral[mini].ypos);
		ctx.stroke();	
		return(minDist);
	}
};

function boundArea(a) {
  var minx = 0; var miny=0;
  var maxx = 0; var maxy=0; 
  
  for (var i=0; i<a.length; i++) {
    if (minx>a[i].xpos) { minx = a[i].xpos; }
    else if (maxx<a[i].xpos) { maxx=a[i].xpos; }
    if (miny>a[i].ypos) { miny = a[i].ypos; }
    else if (maxy<a[i].ypos) { maxy=a[i].ypos; }
  }
  return((maxx-minx)*(maxy-miny));
}

//bounding boxes for spirals size 0.25 - 5 by 0.25

var spiralBounds = [69257.55836362416, 71653.66979931448, 74090.52055009516, 76568.11061596617, 79086.43999692758, 81645.50869297933, 84245.31670412143, 86885.86403035389, 89567.1506716767, 92289.17662808992, 95051.94189959342, 97855.4464861873, 100699.69038787155, 103584.67360464617, 106510.39613651115, 109476.85798346644, 113366.63078034674, 117980.03176574102, 122674.98211910011]; 

function findSpiralSize(arg) {
  var size = boundArea(arg);
  var min = size; var ind = 0; 
  for (var i=0; i<spiralBounds.length; i++) {
    if(min>spiralBounds[i]) { min=spiralBounds[i]; ind=i;}  
  }
  return(ind);
}