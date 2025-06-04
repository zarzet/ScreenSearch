// This script runs in the context of the web page
// It can be used to add more advanced screenshot or interaction features
// Content script for ScreenSearch extension

// Listen for messages from the popup or background scripts
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  // Handle messages here if needed
  if (message.action === 'getPageInfo') {
    // Example of sending page information back to the extension
    sendResponse({
      title: document.title,
      url: window.location.href
    });
  }
  
  return true; // Keep the message channel open for async responses
});