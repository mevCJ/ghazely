import type { WorkerMessage } from './messages';

/** Resolves false when the worker is gone or refuses the message. */
export const sendToWorker = async (message: WorkerMessage): Promise<boolean> => {
  try {
    const reply = (await chrome.runtime.sendMessage(message)) as { ok?: boolean } | undefined;
    return reply?.ok === true;
  } catch {
    return false;
  }
};
