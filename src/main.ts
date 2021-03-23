import sdk from 'cue-sdk';
import os from 'os';
import WindowsTrayIcon from 'windows-trayicon'

const RAM_POLLING_INTERVAL = 1000;

//#region  Corsair example stuff
const details = sdk.CorsairPerformProtocolHandshake();
const errCode = sdk.CorsairGetLastError();
if (errCode !== 0) {
	console.error(`Handshake failed: ${sdk.CorsairErrorString[errCode]}`);
	exit(1);
}

const availableLeds = getAvailableLeds();
if (!availableLeds.length) {
	console.error('No devices found');
	exit(1);
}
//#endregion

// Setting interval for refresh
setInterval(ligthtRAM, RAM_POLLING_INTERVAL, availableLeds);


function ligthtRAM(leds: any[]) {
	// Count how many LEDs should be lit (10 per Device in leds)
	var ledcount = Math.round(leds.length * 10 * os.freemem() / os.totalmem());
	// Array for calculating RGB values
	var templeds: Array<{ r: number, g: number, b: number }> = [];

	for (let i = 0; i < leds.length * 10; i++) {
		// Percentage values of 255 for R and G (inverted), times 0 if the LED shouldn't be on
		templeds[i] = {
			r: Math.round(255 / 20 * i) * (i <= ledcount ? 1 : 0),
			g: Math.round(255 - 255 / 20 * i) * (i <= ledcount ? 1 : 0),
			b: 0
		}
	};

	// Applying RGB values to the original array
	var j = 0;
	templeds.forEach(led => {
		leds[Math.floor(j / 10)][j % 10].r = led.r;
		leds[Math.floor(j / 10)][j % 10].g = led.g;
		leds[Math.floor(j / 10)][j % 10].b = led.b;
		j++;
	})

	// Setting the LEDs
	let x = 0;
	// Dirty post-increment
	leds.forEach(device => sdk.CorsairSetLedsColorsBufferByDeviceIndex(x++, device));
	sdk.CorsairSetLedsColorsFlushBuffer()
}

//#region More corsair stuff
function exit(code = 0) {
	console.log('Exiting.');
	process.exit(code);
}

function getAvailableLeds() {
	const leds = []
	const deviceCount = sdk.CorsairGetDeviceCount()
	for (let di = 0; di < deviceCount; ++di) {
		const ledPositions = sdk.CorsairGetLedPositionsByDeviceIndex(di)
		leds.push(ledPositions.map((p: { ledId: any }) => ({ ledId: p.ledId, r: 0, g: 0, b: 0 })))
	}

	return leds
}
//#endregion

//#region Tray icon
const trayIcon = new WindowsTrayIcon({
	title: "iCUE-ramram",
	icon: "icon.ico",
	debug: false,
	menu: [
		{
			id: "Quit",
			caption: "Quit iCUE-ramram"
		},
	]
})

trayIcon.item((id: number) => exit());
//#endregion
