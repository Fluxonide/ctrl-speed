var prc_video;
var prc_audio;

function monitor() {
  prc_video = document.getElementsByTagName("video");
  prc_audio = document.getElementsByTagName("audio");

  var playbackRate = localStorage.prc_playbackRate || 1;

  if (prc_video.length || prc_audio.length) {
    for (var i = 0; i < prc_video.length; i++) {
      prc_video[i].playbackRate = playbackRate;
    }

    for (i = 0; i < prc_audio.length; i++) {
      prc_audio[i].playbackRate = playbackRate;
    }

    chrome.runtime.sendMessage({ found: true, playbackRate: playbackRate });
    return;
  } else chrome.runtime.sendMessage({ playbackRate: playbackRate });
}

monitor();

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  var playbackRate = parseFloat(request.playbackRate);

  if (playbackRate) {
    localStorage.prc_playbackRate = playbackRate;

    for (var i = 0; i < prc_video.length; i++) {
      prc_video[i].playbackRate = playbackRate;
    }

    for (i = 0; i < prc_audio.length; i++) {
      prc_audio[i].playbackRate = playbackRate;
    }
  }

  if (request.monitor) {
    monitor();
  }
});
