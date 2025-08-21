chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(request);

  if (request.clicked) {
    chrome.tabs.query(
      { active: true, currentWindow: true },
      async function (tabs) {
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ["inject.js"],
        });

        //send request to content script
        chrome.tabs.sendMessage(
          tabs[0].id,
          { monitor: true },
          function (response) {
            //send playbackRate back to popup for display
            if (response) sendResponse({ playbackRate: response.playbackRate });
          }
        );
      }
    );

    return true;
  } else if (request.found) {
    //inject.js found media elements on webpage
    chrome.runtime.sendMessage(request);
  }
});
