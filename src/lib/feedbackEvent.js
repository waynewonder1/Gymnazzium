// Window event that opens the feedback form from anywhere (e.g. the phone menu).
export const OPEN_FEEDBACK = 'gymnazzium:open-feedback';
export const openFeedback = () => window.dispatchEvent(new Event(OPEN_FEEDBACK));
