import fetch from 'node-fetch';
import fs from 'fs';

var { sonos_room, sonos_http_api, reset_repeat, reset_shuffle, reset_crossfade } = JSON.parse(
  fs.readFileSync('usersettings.json', 'utf-8')
);

let actionConfig = JSON.parse(
  fs.readFileSync('actionConfig.json', 'utf-8')
);

export const get_sonos_url = (sonos_instruction, service_type) => {
  if (service_type == 'completeurl') {
    return sonos_instruction;
  }

  return sonos_http_api + '/' + sonos_room + '/' + sonos_instruction;
};

export default async function process_sonos_command(received_text) {
  const received_text_cleaned = received_text
    .replaceAll('â', '"')
    .replace(/\s/g,'')
    .replaceAll('“', '"')
    .replaceAll('”', '"')
    .replaceAll('', '')
    .replaceAll('', '')
    .replaceAll('', '');
  let request = {};
  
  try {
    request = JSON.parse(received_text_cleaned);
  } catch (e) {
    console.log(received_text_cleaned + " is not valid json.");
  }

  if (request.action === 1) {
    console.log('Attempting remote ssh command');
  } else {
    console.log(
      'Action type ' + request.action + ' not recognnized.'
    );
    return;
  }

  

  // Wait a bit before processing next record so the API has time to respond to first command
  // e.g. want to seek on a new queue -- need the new queue to exist. Is there a way to check/confirm
  // with Sonos that a prior command is complete? I'm not sure if this a sonos thing or the http API
  // sometimes throwing commands into the ether while Sonos is busy.
  await new Promise((resolve) => setTimeout(resolve, 200));
}
