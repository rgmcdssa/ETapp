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

function procUserSpiral() {
	
}