import { RECHECK_ALARM, type RestPlatform } from './rest-detector';

export const chromePlatform: RestPlatform = {
  setDetectionInterval: (s) => chrome.idle.setDetectionInterval(s),
  onIdleChanged: (listener) => chrome.idle.onStateChanged.addListener(listener),
  queryIdle: (s) => chrome.idle.queryState(s),
  hasAudibleTab: async () => (await chrome.tabs.query({ audible: true })).length > 0,
  // 0.5 minutes is the shortest alarm period Chrome allows.
  startRecheck: () => void chrome.alarms.create(RECHECK_ALARM, { periodInMinutes: 0.5 }),
  stopRecheck: () => void chrome.alarms.clear(RECHECK_ALARM),
};
