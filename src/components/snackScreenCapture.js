/** Expo Snack does not have the native image-capture module installed. */
async function captureScreen(){
 throw new Error("Real screenshot capture requires a development build on iOS or Android. Expo Go Snack cannot capture these pixels.");
}
async function captureRef(){return captureScreen();}
export {captureScreen,captureRef};
