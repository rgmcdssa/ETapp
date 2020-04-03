
function pageLoad() {

}

function reset() {
	
}

var audioData=[];
function recordVoice() {
	if (document.getElementById("recordButton").value == "Stop") { 
		rec.stop();
		document.getElementById("recordButton").value = "Record";
	}
	else {
		document.getElementById("recordButton").value = "Stop";
		audioData=[];
		navigator.mediaDevices.getUserMedia({audio:true}).then(stream=> {recordHandler(stream)});
	}
}

function recordHandler(s) {
	rec = new MediaRecorder(s);
	rec.start();

	rec.onddataavailable = function(e) {
		audioData.push(e.data);
		if (rec.state == "inactive") {
			let blob = new Blob(audioData, {type:'audio/mpeg-3'});
			recordedAudio.src = URL.createObjectURL(blob);
			recordedAudio.controls = true;
			recordedAudio.autoplay = false; 
		}
	}
}

function playVoice() {
	alert('Playing audio.');
	recordedAudio.play();
}