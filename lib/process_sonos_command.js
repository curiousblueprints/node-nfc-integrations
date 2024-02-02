import fs from 'fs';
import { exec } from 'child_process';
import { Client } from 'ssh2';

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

    const conn = new Client();
    conn.on('ready', () => {
      console.log('Client :: ready');
      const execStr = 'uiopen shortcuts://run-shortcut?name=playMusic\&input=text\&text=' + encodeURIComponent(actionConfig.albumDb[request.param].name);
      console.log(execStr);
      conn.exec(execStr, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          conn.end();
        }).on('data', (data) => {
          console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
          console.log('STDERR: ' + data);
        });
      });
    }).connect({
      host: actionConfig.remoteSshServer,
      port: 22,
      username: actionConfig.remoteSshUsername,
      password: actionConfig.remoteSshPassword
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
