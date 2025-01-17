export type RequestFnType = (
  url: string,
  data: Record<string, unknown>
) => void;

export const requestWithXMLHttpRequest: RequestFnType = (url, data) => {
  const serializedData = JSON.stringify(data);
  const report = new XMLHttpRequest();
  report.open('POST', url);
  report.setRequestHeader('Content-Type', 'application/json');
  report.setRequestHeader('Content-Length', `${serializedData.length}`);
  report.send(serializedData);
};

export const requestWithSendBeacon: RequestFnType = (url, data) => {
  const serializedData = JSON.stringify(data);
  if (!navigator.sendBeacon(url, serializedData)) {
    return requestWithXMLHttpRequest(url, data);
  }
};

export const requestWithNodeHttpModule: RequestFnType = (url, data) => {
  const serializedData = JSON.stringify(data);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { protocol, host, path } = require('url').parse(url);
  const options = {
    protocol,
    host,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': serializedData.length,
    },
  };

  const { request: nodeRequest } =
    url.indexOf('https://') === 0 ? require('https') : require('http');
  const req = nodeRequest(options);

  req.on('error', (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
  });

  req.write(serializedData);
  req.end();
};
