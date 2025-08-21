var slider = document.getElementById("slider");
makeSlider(slider);

var fill = slider.getElementsByClassName("sliderFill")[0];
slider.fill = fill;

var label = document.getElementById("sliderLabel");
slider.label = label;

var buttons = document.getElementsByClassName("preset");

//add click events to buttons
for (var i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener("click", function () {
    setPlaybackRate(parseFloat(this.dataset.speed));
  });
}

//add click event to decrement button
document.getElementById("decrement").addEventListener("click", function () {
  var newPlaybackRate = Math.max(1 / 16, playbackRate - 0.01);
  setPlaybackRate(newPlaybackRate);
});

//add click event to increment button
document.getElementById("increment").addEventListener("click", function () {
  var newPlaybackRate = Math.min(16, playbackRate + 0.01);
  setPlaybackRate(newPlaybackRate);
});

var playbackRate = 1;

var video = document.getElementsByTagName("video");
var audio = document.getElementsByTagName("audio");

var colors = ["red", "green", "cyan", "darkRed"];

//snapPoints given in playback speed
slider.snapPoints = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];

//convert snapPoints to progress
for (var i = 0; i < slider.snapPoints.length; i++) {
  slider.snapPoints[i] = mapSpeedToProgress(slider.snapPoints[i]);
}

function setColorClass(element, color) {
  if (element.classList.contains(color)) return;

  for (var i = 0; i < colors.length; i++) {
    if (element.classList.contains(colors[i]))
      element.classList.remove(colors[i]);
  }

  element.classList.add(color);
}

//piecewise function for UX purposes
function mapProgressToSpeed(progress) {
  if (progress <= 0.5) return progress * 2;
  else if (progress <= 0.75) return progress * 4 - 1;
  else return -1 / ((progress - 1) * 2);
}

function mapSpeedToProgress(speed) {
  if (speed <= 1) return speed / 2;
  else if (speed <= 2) return (speed + 1) / 4;
  else return -1 / speed / 2 + 1;
}

function setPlaybackRate(speed) {
  slider.setProgress(mapSpeedToProgress(speed), false);
}

slider.onChange = function (progress) {
  //calculate playbackRate from progress
  playbackRate = Math.abs(mapProgressToSpeed(progress).toFixed(3));
  playbackRate = Math.max(1 / 16, Math.min(playbackRate, 16));

  //send playback rate to active tab
  if (chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { playbackRate: playbackRate });
    });
  }

  //set label text
  this.label.textContent = playbackRate.toFixed(2) + "x";

  //set fill properties
  var fillWidth = progress * 100;

  this.fill.style.width = fillWidth + "%";
  this.fill.style.margin = 0;

  if (playbackRate > 1.0) setColorClass(this.fill, "cyan");
  else if (playbackRate < 1.0) setColorClass(this.fill, "red");
  else if (playbackRate == 1.0) setColorClass(this.fill, "green");
};

//slider library
function makeSlider(element) {
  var handle = element.getElementsByClassName("sliderHandle")[0];
  element.handle = handle;

  function snapToPoints(progress) {
    var epsilon = 0.02;

    for (var i = 0; i < element.snapPoints.length; i++) {
      if (
        progress >= element.snapPoints[i] - epsilon &&
        progress <= element.snapPoints[i] + epsilon
      ) {
        return element.snapPoints[i];
      }
    }

    return progress;
  }

  element.setProgress = function (progress, mouseInput = true) {
    progress = Math.min(1, Math.max(0, progress));
    if (mouseInput) progress = snapToPoints(progress);

    this.progress = progress;

    if (this.onChange) this.onChange(progress);

    progress *= 100;
    this.handle.style.left = progress + "%";
  };

  //empty event, function gets called every time position of slider changes
  element.onChange = function (progress) {};

  function OnInteraction(event) {
    if (this.interacting) {
      var x = event.clientX || event.pageX;
      var rect = this.getBoundingClientRect();

      this.setProgress((x - rect.left) / rect.width);
    }
  }

  element.addEventListener("mousedown", function OnMouseDown(event) {
    if (event.button === 0) {
      this.interacting = true;
      this.handle.classList.add("interacting");
      OnInteraction.call(element, event);
    }
  });

  document.addEventListener("mousemove", function OnMouseMove(event) {
    OnInteraction.call(element, event);
  });

  document.addEventListener("mouseup", function OnMouseUp(event) {
    element.interacting = false;
    element.handle.classList.remove("interacting");
  });

  element.addEventListener("mousewheel", function OnMouseScroll(event) {
    if (event.deltaY < 0) element.setProgress(element.progress + 0.025);
    else element.setProgress(element.progress - 0.025);
  });
}

//send message
chrome.runtime.sendMessage({ clicked: true }, function (response) {
  console.log(response);

  if (response) {
    playbackRate = parseFloat(response.playbackRate);

    //init slider at saved value
    setPlaybackRate(playbackRate);
  }
});

//recieve message
chrome.runtime.onMessage.addListener(function (request, sender) {
  if (request.found) {
    document.getElementById("controls").hidden = false;
    document.getElementById("errorMessage").hidden = true;

    playbackRate = parseFloat(request.playbackRate);

    //init slider at saved value
    setPlaybackRate(playbackRate);
  }
});
