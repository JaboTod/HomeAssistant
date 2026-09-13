const exposes = require('zigbee-herdsman-converters/lib/exposes');
const tuya = require('zigbee-herdsman-converters/lib/tuya');
const e = exposes.presets;
const ea = exposes.access;

// Tuya TS0601 water valve (_TZE200_nqaqq4cf), sold under several brand names.
// This fingerprint has no known/published converter. Confirmed by capturing
// real Tuya datapoint traffic (zigbee2mqtt debug log, 2026-09-13) while
// physically toggling the valve:
//
//   dp 1   datatype 1 (bool)  -> on/off state. Universal across Tuya valve
//                                 devices, was already mapped with confidence.
//   dp 101 datatype 2 (value) -> counts up by 1 roughly once per second while
//                                 the valve is open (0, 1, 2, 3, ...). Exposed
//                                 as "running_duration" in seconds.
//   dp 102 datatype 4 (enum)  -> a status code. Observed values 0-3 that
//                                 correlate with on/off transitions (1 right
//                                 after turning on, 0 right after turning
//                                 off, 3/2 seen while off/idle beforehand),
//                                 but only one open/close cycle was captured
//                                 - not enough to confidently label what each
//                                 value means. Exposed as a raw numeric
//                                 "status_code" rather than guessing English
//                                 names for an enum lookup.
//
// No battery datapoint was seen because this valve is mains-powered, not
// battery (confirmed in its original Zigbee interview: "powerSource": "Mains
// (single phase)").
const definition = {
    fingerprint: tuya.fingerprint('TS0601', ['_TZE200_nqaqq4cf']),
    model: 'TS0601_water_valve',
    vendor: 'Tuya',
    description: 'Water valve (on/off, running duration, raw status code)',
    fromZigbee: [tuya.fz.datapoints],
    toZigbee: [tuya.tz.datapoints],
    onEvent: tuya.onEventSetTime,
    configure: tuya.configureMagicPacket,
    exposes: [
        e.switch().setAccess('state', ea.STATE_SET).withDescription('Valve open/closed'),
        e.numeric('running_duration', ea.STATE).withUnit('s')
            .withDescription('Seconds since the valve was last opened. Counts up while open.'),
        e.numeric('status_code', ea.STATE)
            .withDescription('Raw device status code (dp 102). Meaning of each value not yet confirmed - shown as-is rather than guessed.'),
    ],
    meta: {
        tuyaDatapoints: [
            [1, 'state', tuya.valueConverter.onOff],
            [101, 'running_duration', tuya.valueConverter.raw],
            [102, 'status_code', tuya.valueConverter.raw],
        ],
    },
};

module.exports = definition;
