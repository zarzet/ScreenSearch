// Configuration and environment variables
const config = {
  // API key storage
  apiKey: null,
  
  // Initialize configuration
  async init() {
    // Load API key from Chrome storage
    return new Promise(resolve => {
      chrome.storage.local.get(['apiKey'], (result) => {
        if (result.apiKey) {
          this.apiKey = result.apiKey;
          console.log('API key loaded from storage');
        } else {
          console.log('No API key found in storage');
        }
        resolve();
      });
    });
  },
  
  // Save API key to Chrome storage
  saveApiKey(apiKey) {
    this.apiKey = apiKey;
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ apiKey }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving API key:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('API key saved to storage');
          resolve();
        }
      });
    });
  },
  
  // Get the current API key
  getApiKey() {
    return this.apiKey;
  },
  
  // Remove API key from storage
  removeApiKey() {
    this.apiKey = null;
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(['apiKey'], () => {
        if (chrome.runtime.lastError) {
          console.error('Error removing API key:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('API key removed from storage');
          resolve();
        }
      });
    });
  }
};

// Initialize configuration when script loads
config.init();