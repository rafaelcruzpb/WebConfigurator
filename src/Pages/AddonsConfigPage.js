import React, { useEffect, useState } from 'react';
import { Button, Form, Row, Col } from 'react-bootstrap';
import { Formik, useFormikContext } from 'formik';
import * as yup from 'yup';
import FormControl from '../Components/FormControl';
import FormSelect from '../Components/FormSelect';
import Section from '../Components/Section';
import WebApi from '../Services/WebApi';
import _ from 'lodash';

const I2C_BLOCKS = [
	{ label: 'i2c0', value: 0 },
	{ label: 'i2c1', value: 1 },
];

const ON_BOARD_LED_MODES = [
	{ label: 'Off', value: 0 },
	{ label: 'Mode Indicator', value: 1 },
	{ label: 'Input Test', value: 2 }
];

const DUAL_STICK_MODES = [
	{ label: 'D-Pad', value: 0 },
	{ label: 'Left Analog', value: 1 },
	{ label: 'Right Analog', value: 2 },
];

const DUAL_COMBINE_MODES = [
    { label: 'Mixed', value: 0 },
	{ label: 'Gamepad', value: 1},
	{ label: 'Dual Directional', value: 2 },
	{ label: 'None', value: 3 }
];

const BUZZER_MODE = [
	{ label: 'Disabled', value: 0 },
	{ label: 'Enabled', value: 1 },
];

const schema = yup.object().shape({
	turboPin: yup.number().required().min(-1).max(29).test('', '${originalValue} is already assigned!', (value) => usedPins.indexOf(value) === -1).label('Turbo Pin'),
	turboPinLED: yup.number().required().min(-1).max(29).test('', '${originalValue} is already assigned!', (value) => usedPins.indexOf(value) === -1).label('Turbo Pin LED'),
	sliderLSPin: yup.number().required().min(-1).max(29).test('', '${originalValue} is already assigned!', (value) => usedPins.indexOf(value) === -1).label('Slider LS Pin'),
	sliderRSPin: yup.number().required().min(-1).max(29).test('', '${originalValue} is already assigned!', (value) => usedPins.indexOf(value) === -1).label('Slider RS Pin'),
	turboShotCount: yup.number().required().min(5).max(30).label('Turbo Shot Count'),
	reversePin: yup.number().required().min(-1).max(29).test('', '${originalValue} is already assigned!', (value) => usedPins.indexOf(value) === -1).label('Reverse Pin'),
	reversePinLED: yup.number().required().min(-1).max(29).test('', '${originalValue} is already assigned!', (value) => usedPins.indexOf(value) === -1).label('Reverse Pin LED'),
	i2cAnalog1219SDAPin: yup.number().required().min(-1).max(29).test('', '${originalValue} is already assigned!', (value) => usedPins.indexOf(value) === -1).label('I2C Analog1219 SDA Pin'),
	i2cAnalog1219SCLPin: yup.number().required().min(-1).max(29).test('', '${originalValue} is already assigned!', (value) => usedPins.indexOf(value) === -1).label('I2C Analog1219 SCL Pin'),
	i2cAnalog1219Block: yup.number().required().oneOf(I2C_BLOCKS.map(o => o.value)).label('I2C Analog1219 Block'),
	i2cAnalog1219Speed: yup.number().required().label('I2C Analog1219 Speed'),
	i2cAnalog1219Address: yup.number().required().label('I2C Analog1219 Address'),
	onBoardLedMode: yup.number().required().oneOf(ON_BOARD_LED_MODES.map(o => o.value)).label('On-Board LED Mode'),
	dualDirUpPin: yup.number().required().min(-1).max(29).test('', '${originalValue} is already assigned!', (value) => usedPins.indexOf(value) === -1).label('Dual Directional Up Pin'),
	dualDirDownPin: yup.number().required().min(-1).max(29).test('', '${originalValue} is already assigned!', (value) => usedPins.indexOf(value) === -1).label('Dual Directional Down Pin'),
	dualDirLeftPin: yup.number().required().min(-1).max(29).test('', '${originalValue} is already assigned!', (value) => usedPins.indexOf(value) === -1).label('Dual Directional Left Pin'),
	dualDirRightPin: yup.number().required().min(-1).max(29).test('', '${originalValue} is already assigned!', (value) => usedPins.indexOf(value) === -1).label('Dual Directional Right Pin'),
	dualDirDpadMode : yup.number().required().oneOf(DUAL_STICK_MODES.map(o => o.value)).label('Dual Stick Mode'), 
	dualDirCombineMode : yup.number().required().oneOf(DUAL_COMBINE_MODES.map(o => o.value)).label('Dual Combination Mode'),
	buzzerEnabled: yup.number().required().min(0).max(1).label('Enabled?'),
	buzzerPin: yup.number().required().min(-1).max(29).test('', '${originalValue} is already assigned!', (value) => usedPins.indexOf(value) === -1).label('Buzzer Pin'),
	buzzerVolume: yup.number().required().min(0).max(100).label('Buzzer Volume'),
	buzzerIntroSong: yup.number().required().min(-1).label('Buzzer Intro Song'),
	buzzerCustomIntroSongToneDuration: yup.number().required().min(0).max(1000).label('Custom Intro Song Tone Duration'),
	buzzerCustomIntroSong: yup.string().required().test(
		'', 
		null, 
		(value, testContext) => {
			let errors = value.replace(/(\r\n| |\n|\r)/gm,"").toUpperCase().split(',').filter((t) => {if (notes[t] === undefined) return t;}); 
			if (errors.length > 0) {
				return testContext.createError({message: "Notes '"+errors.join(', ')+"' invalid."});
			}
			return true;
		})
		.label('Custom Intro Song Tones'),
});

const defaultValues = {
	turboPin: -1,
	turboPinLED: -1,
	sliderLSPin: -1,
	sliderRSPin: -1,
	turboShotCount: 5,
	reversePin: -1,
	reversePinLED: -1,
	i2cAnalog1219SDAPin: -1,
	i2cAnalog1219SCLPin: -1,
	i2cAnalog1219Block: 0,
	i2cAnalog1219Speed: 400000,
	i2cAnalog1219Address: 0x40,
	onBoardLedMode: 0,
	dualUpPin: -1,
	dualDownPin: -1,
	dualLeftPin: -1,
	dualRightPin: -1,
	dualDirDpadMode: 0,
	dualDirCombineMode: 0,
	buzzerEnabled: 0,
	buzzerPin: -1,
	buzzerVolume: 100,
	buzzerIntroSong: -1,
	buzzerCustomIntroSongToneDuration: 150,
	buzzerCustomIntroSong: "",
};

const REVERSE_ACTION = [
	{ label: 'Disable', value: 0 },
	{ label: 'Enable', value: 1 },
	{ label: 'Neutral', value: 2 },
];

const BUZZER_INTRO_OPTIONS = [
	{index: -1, name: "OFF"},
	{index: 0, name: "CUSTOM"},
];

const BUZZER_CUSTOM_SONG_LENGTH_LIMIT = 250;

const notes = {
	B0 : 31,
	C1 : 33,
	CS1 : 35,
	DS1 : 39,
	E1 : 41,
	F1 : 44,
	FS1 : 46,
	G1 : 49,
	GS1 : 52,
	A1 : 55,
	AS1 : 58,
	B1 : 62,
	C2 : 65,
	CS2 : 69,
	D2 : 73,
	DS2 : 78,
	E2 : 82,
	F2 : 87,
	FS2 : 93,
	G2 : 98,
	GS2 : 104,
	A2 : 110,
	AS2 : 117,
	B2 : 123,
	C3 : 131,
	CS3 : 139,
	D3 : 147,
	DS3 : 156,
	E3 : 165,
	F3 : 175,
	FS3 : 185,
	G3 : 196,
	GS3 : 208,
	A3 : 220,
	AS3 : 233,
	B3 : 247,
	C4 : 262,
	CS4 : 277,
	D4 : 294,
	DS4 : 311,
	E4 : 330,
	F4 : 349,
	FS4 : 370,
	G4 : 392,
	GS4 : 415,
	A4 : 440,
	AS4 : 466,
	B4 : 494,
	C5 : 523,
	CS5 : 554,
	D5 : 587,
	DS5 : 622,
	E5 : 659,
	F5 : 698,
	FS5 : 740,
	G5 : 784,
	GS5 : 831,
	A5 : 880,
	AS5 : 932,
	B5 : 988,
	C6 : 1047,
	CS6 : 1109,
	D6 : 1175,
	DS6 : 1245,
	E6 : 1319,
	F6 : 1397,
	FS6 : 1480,
	G6 : 1568,
	GS6 : 1661,
	A6 : 1760,
	AS6 : 1865,
	B6 : 1976,
	C7 : 2093,
	CS7 : 2217,
	D7 : 2349,
	DS7 : 2489,
	E7 : 2637,
	F7 : 2794,
	FS7 : 2960,
	G7 : 3136,
	GS7 : 3322,
	A7 : 3520,
	AS7 : 3729,
	B7 : 3951,
	C8 : 4186,
	CS8 : 4435,
	D8 : 4699,
	DS8 : 4978,
	PAUSE : 0
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const oscillator = audioCtx.createOscillator();

oscillator.type = 'square';
oscillator.frequency.value = 0;
oscillator.connect(audioCtx.destination);

let usedPins = [];
let buzzerSongs = [];

const FormContext = () => {
	const { values, setValues } = useFormikContext();

	useEffect(() => {
		async function fetchData() {
			const data = await WebApi.getAddonsOptions();
			usedPins = data.usedPins;
			buzzerSongs = data.buzzerSongs.map((o, i) => ({index: i+1, name: (i+1)+" - "+o.name, toneDuration: o.toneDuration, tones: o.tones}));
			delete data.buzzerSongs;
			setValues(data);
		}
		fetchData();
	}, [setValues]);

	useEffect(() => {
		if (!!values.turboPin)
			values.turboPin = parseInt(values.turboPin);
		if (!!values.turboPinLED)
			values.turboPinLED = parseInt(values.turboPinLED);
		if (!!values.sliderLSPin)
			values.sliderLSPin = parseInt(values.sliderLSPin);
		if (!!values.sliderRSPin)
			values.sliderRSPin = parseInt(values.sliderRSPin);
		if (!!values.turboShotCount)
			values.turboShotCount = parseInt(values.turboShotCount);
		if (!!values.reversePin)
			values.reversePin = parseInt(values.reversePin);
		if (!!values.reversePinLED)
			values.reversePinLED = parseInt(values.reversePinLED);
		if (!!values.reverseActionUp)
			values.reverseActionUp = parseInt(values.reverseActionUp);
		if (!!values.reverseActionDown)
			values.reverseActionDown = parseInt(values.reverseActionDown);
		if (!!values.reverseActionLeft)
			values.reverseActionLeft = parseInt(values.reverseActionLeft);
		if (!!values.reverseActionRight)
			values.reverseActionRight = parseInt(values.reverseActionRight);
		if (!!values.i2cAnalog1219SDAPin)
			values.i2cAnalog1219SDAPin = parseInt(values.i2cAnalog1219SDAPin);
		if (!!values.i2cAnalog1219SCLPin)
			values.i2cAnalog1219SCLPin = parseInt(values.i2cAnalog1219SCLPin);
		if (!!values.i2cAnalog1219Block)
			values.i2cAnalog1219Block = parseInt(values.i2cAnalog1219Block);
		if (!!values.i2cAnalog1219Speed)
			values.i2cAnalog1219Speed = parseInt(values.i2cAnalog1219Speed);
		if (!!values.i2cAnalog1219Address)
			values.i2cAnalog1219Address = parseInt(values.i2cAnalog1219Address);
		if (!!values.onBoardLedMode)
			values.onBoardLedMode = parseInt(values.onBoardLedMode);
		if (!!values.dualDownPin)
			values.dualDownPin = parseInt(values.dualDownPin);
		if (!!values.dualUpPin)
			values.dualUpPin = parseInt(values.dualUpPin);
		if (!!values.dualLeftPin)
			values.dualLeftPin = parseInt(values.dualLeftPin);
		if (!!values.dualRightPin)
			values.dualRightPin = parseInt(values.dualRightPin);
		if (!!values.dualDirMode)
			values.dualDirMode = parseInt(values.dualDirMode);
		if (!!values.buzzerEnabled)
			values.buzzerEnabled = parseInt(values.buzzerEnabled);
		if (!!values.buzzerPin)
			values.buzzerPin = parseInt(values.buzzerPin);
		if (!!values.buzzerVolume)
			values.buzzerVolume = parseInt(values.buzzerVolume);
		if (!!values.buzzerIntroSong)
			values.buzzerIntroSong = parseInt(values.buzzerIntroSong);
		if (!!values.buzzerCustomIntroSongToneDuration)
			values.buzzerCustomIntroSongToneDuration = parseInt(values.buzzerCustomIntroSongToneDuration);
		if (!!values.buzzerCustomIntroSong)
			values.buzzerCustomIntroSong = values.buzzerCustomIntroSong.replace(/(\r\n| |\n|\r)/gm,"").toUpperCase();
	}, [values, setValues]);

	return null;
};

export default function AddonsConfigPage() {
	const [saveMessage, setSaveMessage] = useState('');
	const [playingState, setPlayingState] = useState(false);
	const [currentSong, setCurrentSong] = useState(null);

	const onSuccess = async (values) => {
		const success = WebApi.setAddonsOptions(values);
		setSaveMessage(success ? 'Saved! Please Restart Your Device' : 'Unable to Save');
	};

	var lastPlayingIntervalId;

	useEffect(() => {
		if (currentSong == null) return;

		var currentIndexTone = 0;

		lastPlayingIntervalId = setInterval(() => {

			if (currentIndexTone > currentSong.song.length-1) {
				oscillator.disconnect(audioCtx.destination);
				clearTimeout(lastPlayingIntervalId);
				setPlayingState(false);
				return;
			}
			
			let tone = currentSong.song[currentIndexTone];
			
			if (notes[tone] !== undefined) {
				oscillator.frequency.setValueAtTime(notes[tone], audioCtx.currentTime);

				if (audioCtx.state === 'suspended') {
					oscillator.start();
				}
				oscillator.connect(audioCtx.destination);
			}
			currentIndexTone++;
		}, currentSong.toneDuration);
		
	}, [currentSong]);

	const onPlaySong = async (introSongSelectValue, customToneDurationSong, customSong) => {

		if (playingState) {
			clearInterval(lastPlayingIntervalId);
			oscillator.disconnect(audioCtx.destination);
			setPlayingState(false);
			return;
		}

		if (introSongSelectValue == 0) { // custom song
			setCurrentSong({toneDuration: customToneDurationSong, song: customSong.replace(/(\r\n| |\n|\r)/gm,"").toUpperCase().split(',')});
			setPlayingState(true);
		} else if(introSongSelectValue > 0) { // one song from select
			let songSelected = buzzerSongs[introSongSelectValue-1];

			if (songSelected !== undefined) {
				let tonesTranslated = songSelected.tones.map((freq) => {
					for (let keyNote in notes) {
						if (notes[keyNote] == freq) return keyNote;
					}
				});
				console.log(tonesTranslated);
				setCurrentSong({toneDuration: songSelected.toneDuration, song: tonesTranslated});
				setPlayingState(true);
			}
		}
	};

	return (
	<Formik validationSchema={schema} onSubmit={onSuccess} initialValues={defaultValues}>
			{({
				handleSubmit,
				handleChange,
				handleBlur,
				values,
				touched,
				errors,
			}) => (
				<Form noValidate onSubmit={handleSubmit}>
					<Section title="Add-Ons Configuration">
						<p>Use the form below to reconfigure experimental options in GP2040-CE.</p>
						<p>Please note: these options are experimental for the time being.</p>
					</Section>
					<Section title="On-Board LED Configuration">
							<FormSelect
								label="LED Mode"
								name="onBoardLedMode"
								className="form-select-sm"
								groupClassName="col-sm-4 mb-3"
								value={values.onBoardLedMode}
								error={errors.onBoardLedMode}
								isInvalid={errors.onBoardLedMode}
								onChange={handleChange}>
								{ON_BOARD_LED_MODES.map((o, i) => <option key={`onBoardLedMode-option-${i}`} value={o.value}>{o.label}</option>)}
							</FormSelect>
					</Section>
					<Section title="Turbo">
						<Col>
							<FormControl type="number"
								label="Turbo Pin"
								name="turboPin"
								className="form-select-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.turboPin}
								error={errors.turboPin}
								isInvalid={errors.turboPin}
								onChange={handleChange}
								min={-1}
								max={29}
							/>
							<FormControl type="number"
								label="Turbo Pin LED"
								name="turboPinLED"
								className="form-select-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.turboPinLED}
								error={errors.turboPinLED}
								isInvalid={errors.turboPinLED}
								onChange={handleChange}
								min={-1}
								max={29}
							/>
							<FormControl type="number"
								label="Turbo Shot Count"
								name="turboShotCount"
								className="form-control-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.turboShotCount}
								error={errors.turboShotCount}
								isInvalid={errors.turboShotCount}
								onChange={handleChange}
								min={2}
								max={30}
							/>
						</Col>
					</Section>
					<Section title="Joystick Selection Slider">
						<Col>
							<FormControl type="number"
								label="Slider LS Pin"
								name="sliderLSPin"
								className="form-select-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.sliderLSPin}
								error={errors.sliderLSPin}
								isInvalid={errors.sliderLSPin}
								onChange={handleChange}
								min={-1}
								max={29}
							/>
							<FormControl type="number"
								label="Slider RS Pin"
								name="sliderRSPin"
								className="form-control-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.sliderRSPin}
								error={errors.sliderRSPin}
								isInvalid={errors.sliderRSPin}
								onChange={handleChange}
								min={-1}
								max={29}
							/>
						</Col>
					</Section>
					<Section title="Input Reverse">
						<Col>
							<FormControl type="number"
								label="Reverse Input Pin"
								name="reversePin"
								className="form-select-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.reversePin}
								error={errors.reversePin}
								isInvalid={errors.reversePin}
								onChange={handleChange}
								min={-1}
								max={29}
							/>
							<FormControl type="number"
								label="Reverse Input Pin LED"
								name="reversePinLED"
								className="form-select-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.reversePinLED}
								error={errors.reversePinLED}
								isInvalid={errors.reversePinLED}
								onChange={handleChange}
								min={-1}
								max={29}
							/>
							<FormSelect
								label="Reverse Up"
								name="reverseActionUp"
								className="form-select-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.reverseActionUp}
								error={errors.reverseActionUp}
								isInvalid={errors.reverseActionUp}
								onChange={handleChange}
							>
								{REVERSE_ACTION.map((o, i) => <option key={`reverseActionUp-option-${i}`} value={o.value}>{o.label}</option>)}
							</FormSelect>
							<FormSelect
								label="Reverse Down"
								name="reverseActionDown"
								className="form-select-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.reverseActionDown}
								error={errors.reverseActionDown}
								isInvalid={errors.reverseActionDown}
								onChange={handleChange}
							>
								{REVERSE_ACTION.map((o, i) => <option key={`reverseActionDown-option-${i}`} value={o.value}>{o.label}</option>)}
							</FormSelect>
							<FormSelect
								label="Reverse Left"
								name="reverseActionLeft"
								className="form-select-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.reverseActionLeft}
								error={errors.reverseActionLeft}
								isInvalid={errors.reverseActionLeft}
								onChange={handleChange}
							>
								{REVERSE_ACTION.map((o, i) => <option key={`reverseActionLeft-option-${i}`} value={o.value}>{o.label}</option>)}
							</FormSelect>
							<FormSelect
								label="Reverse Right"
								name="reverseActionRight"
								className="form-select-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.reverseActionRight}
								error={errors.reverseActionRight}
								isInvalid={errors.reverseActionRight}
								onChange={handleChange}
							>
								{REVERSE_ACTION.map((o, i) => <option key={`reverseActionRight-option-${i}`} value={o.value}>{o.label}</option>)}
							</FormSelect>
						</Col>
					</Section>
					<Section title="I2C Analog ADS1219">
						<Col>
							<FormControl type="number"
								label="I2C Analog ADS1219 SDA Pin"
								name="i2cAnalog1219SDAPin"
								className="form-control-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.i2cAnalog1219SDAPin}
								error={errors.i2cAnalog1219SDAPin}
								isInvalid={errors.i2cAnalog1219SDAPin}
								onChange={handleChange}
								min={-1}
								max={29}
							/>
							<FormControl type="number"
								label="I2C Analog ADS1219 SCL Pin"
								name="i2cAnalog1219SCLPin"
								className="form-select-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.i2cAnalog1219SCLPin}
								error={errors.i2cAnalog1219SCLPin}
								isInvalid={errors.i2cAnalog1219SCLPin}
								onChange={handleChange}
								min={-1}
								max={29}
							/>
							<FormSelect
								label="I2C Analog ADS1219 Block"
								name="i2cAnalog1219Block"
								className="form-select-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.i2cAnalog1219Block}
								error={errors.i2cAnalog1219Block}
								isInvalid={errors.i2cAnalog1219Block}
								onChange={handleChange}
							>
								{I2C_BLOCKS.map((o, i) => <option key={`i2cBlock-option-${i}`} value={o.value}>{o.label}</option>)}
							</FormSelect>
							<FormControl
								label="I2C Analog ADS1219 Speed"
								name="i2cAnalog1219Speed"
								className="form-control-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.i2cAnalog1219Speed}
								error={errors.i2cAnalog1219Speed}
								isInvalid={errors.i2cAnalog1219Speed}
								onChange={handleChange}
								min={100000}
							/>
							<FormControl
								label="I2C Analog ADS1219 Address"
								name="i2cAnalog1219Address"
								className="form-control-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.i2cAnalog1219Address}
								error={errors.i2cAnalog1219Address}
								isInvalid={errors.i2cAnalog1219Address}
								onChange={handleChange}
								maxLength={4}
							/>
						</Col>
					</Section>
					<Section title="Dual Directional Input">
						<Col>
							<FormControl type="number"
								label="Dual Directional Up Pin"
								name="dualDirUpPin"
								className="form-select-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.dualDirUpPin}
								error={errors.dualDirUpPin}
								isInvalid={errors.dualDirUpPin}
								onChange={handleChange}
								min={-1}
								max={29}
							/>
							<FormControl type="number"
								label="Dual Directional Down Pin"
								name="dualDirDownPin"
								className="form-select-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.dualDirDownPin}
								error={errors.dualDirDownPin}
								isInvalid={errors.dualDirDownPin}
								onChange={handleChange}
								min={-1}
								max={29}
							/>
							<FormControl type="number"
								label="Dual Directional Left Pin"
								name="dualDirLeftPin"
								className="form-select-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.dualDirLeftPin}
								error={errors.dualDirLeftPin}
								isInvalid={errors.dualDirLeftPin}
								onChange={handleChange}
								min={-1}
								max={29}
							/>
							<FormControl type="number"
								label="Dual Directional Right Pin"
								name="dualDirRightPin"
								className="form-select-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.dualDirRightPin}
								error={errors.dualDirRightPin}
								isInvalid={errors.dualDirRightPin}
								onChange={handleChange}
								min={-1}
								max={29}
							/>
							<Form.Group className="row mb-3">
								<Form.Label>Dual Directional D-Pad Mode</Form.Label>
								<div className="col-sm-3">
									<Form.Select name="dualDirDpadMode" className="form-select-sm" value={values.dualDirDpadMode} onChange={handleChange} isInvalid={errors.dualDirDpadMode}>
										{DUAL_STICK_MODES.map((o, i) => <option key={`button-dualDirDpadMode-option-${i}`} value={o.value}>{o.label}</option>)}
									</Form.Select>
									<Form.Control.Feedback type="invalid">{errors.dualDirDpadMode}</Form.Control.Feedback>
								</div>
							</Form.Group>
							<Form.Group className="row mb-3">
								<Form.Label>Dual Directional Combination Mode</Form.Label>
								<div className="col-sm-3">
									<Form.Select name="dualDirCombineMode" className="form-select-sm" value={values.dualDirCombineMode} onChange={handleChange} isInvalid={errors.dualDirCombineMode}>
										{DUAL_COMBINE_MODES.map((o, i) => <option key={`button-dualDirCombineMode-option-${i}`} value={o.value}>{o.label}</option>)}
									</Form.Select>
									<Form.Control.Feedback type="invalid">{errors.dualDirCombineMode}</Form.Control.Feedback>
								</div>
							</Form.Group>
						</Col>
					</Section>
					<Section title="Buzzer Speaker">
						<Col>
							<Form.Group className="row mb-3">
								<Form.Label>Use Buzzer</Form.Label>
								<div className="col-sm-3">
									<Form.Select name="buzzerEnabled" className="form-select-sm" value={values.buzzerEnabled} onChange={handleChange} isInvalid={errors.buzzerEnabled}>
										{BUZZER_MODE.map((o, i) => <option key={`button-buzzerEnabled-option-${i}`} value={o.value}>{o.label}</option>)}
									</Form.Select>
									<Form.Control.Feedback type="invalid">{errors.buzzerEnabled}</Form.Control.Feedback>
								</div>
							</Form.Group>
							<FormControl type="number"
								label="Buzzer Pin"
								name="buzzerPin"
								className="form-control-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.buzzerPin}
								error={errors.buzzerPin}
								isInvalid={errors.buzzerPin}
								onChange={handleChange}
								min={-1}
								max={29}
							/>
							<FormControl type="number"
								label="Buzzer Volume"
								name="buzzerVolume"
								className="form-control-sm"
								groupClassName="col-sm-3 mb-3"
								value={values.buzzerVolume}
								error={errors.buzzerVolume}
								isInvalid={errors.buzzerVolume}
								onChange={handleChange}
								min={0}
								max={100}
							/>
							<Form.Group className="row mb-3">
								<Form.Label>Intro Song</Form.Label>
								<div className="col-sm-3">
									<Form.Select name="buzzerIntroSong" className="form-select-sm" value={values.buzzerIntroSong} onChange={handleChange} isInvalid={errors.buzzerIntroSong}>
										{BUZZER_INTRO_OPTIONS.concat(buzzerSongs).map((o, i) => <option key={`button-buzzerIntroSong-option-${i}`} value={o.index}>{o.name}</option>)}
									</Form.Select>
									<Form.Control.Feedback type="invalid">{errors.buzzerIntroSong}</Form.Control.Feedback>
								</div>
								<div className="col-sm-3">
									<Button 
										className="btn-sm" 
										onClick={() => onPlaySong(values.buzzerIntroSong, values.buzzerCustomIntroSongToneDuration, values.buzzerCustomIntroSong)} 
										type="button">
											{playingState ? 'Stop' : 'Play'}
									</Button>
								</div>
							</Form.Group>
							{
								values.buzzerIntroSong == 0
								? ( <>
									<FormControl type="number"
										label="Custom Intro Song Tone Duration (ms)"
										name="buzzerCustomIntroSongToneDuration"
										className="form-control-sm"
										groupClassName="col-sm-3 mb-3"
										value={values.buzzerCustomIntroSongToneDuration}
										error={errors.buzzerCustomIntroSongToneDuration}
										isInvalid={errors.buzzerCustomIntroSongToneDuration}
										onChange={handleChange}
										min={0}
										max={1000}
									/>
									<Form.Group className="row mb-3">
										<Form.Label>Custom Intro Song Tones ({BUZZER_CUSTOM_SONG_LENGTH_LIMIT - values.buzzerCustomIntroSong.length} chars left)</Form.Label>
										<div className="col-sm-3">
											<Form.Control as="textarea" 
												name="buzzerCustomIntroSong" 
												className="form-select-sm" 
												value={values.buzzerCustomIntroSong} 
												onChange={handleChange} 
												error={errors.buzzerCustomIntroSong}
												isInvalid={errors.buzzerCustomIntroSong}
												maxLength={BUZZER_CUSTOM_SONG_LENGTH_LIMIT}
											/>
											<Form.Control.Feedback type="invalid">{errors.buzzerCustomIntroSong}</Form.Control.Feedback>
											<p><small>Valid Notes: {Object.keys(notes).join(', ')}</small></p>
										</div>
									</Form.Group>
									</>
								) 
								: null
							}
						</Col>
					</Section>
					<div className="mt-3">
						<Button type="submit">Save</Button>
						{saveMessage ? <span className="alert">{saveMessage}</span> : null}
					</div>
					<FormContext />
				</Form>
			)}
		</Formik>
	);
}
