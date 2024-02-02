import fs from 'fs';
import { exec } from 'child_process';

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
    console.log('Attempting remote ssh playmusic command');
    if (request.param >= actionConfig.albumDb.length) {
      console.log('param '+ request.param + ' is too large for the album db.');
      return;
    }

    let commandStr = 'ssh ' + actionConfig.remoteSshUsername +
    ':' + actionConfig.remoteSshPassword + 
    '@' + actionConfig.remoteSshServer +
    ' "uiopen shortcuts://run-shortcut?name=playMusic&input=text&text=' + encodeURIComponent(actionConfig.albumDb[request.param].name) + '"';

    exec(commandStr,
      function(error, stdout, stderr){ 
        console.log(stdout);
        console.log('***');
        console.log(error);
        console.log('***');
        console.log(stderr);
        return {
          error: error,
          stdout: stdout,
          stderr: stderr
        };
      });

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
