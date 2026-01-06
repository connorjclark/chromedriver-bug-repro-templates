/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const http = require('http');

describe('Selenium ChromeDriver', function () {
  let driver;
  let server;
  let port;

  // The chrome and chromedriver installation can take some time.
  // Give 5 minutes to install everything.
  this.timeout(5 * 60 * 1000);

  before(function (done) {
    server = http.createServer((req, res) => {
      if (req.url === '/top') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html><head><link rel="StyleSheet" href="/foo.css"></head><body>Hello</body></html>');
      } else if (req.url === '/foo.css') {
        res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="foo"' });
        res.end('Unauthorized');
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  after(function (done) {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  beforeEach(async function () {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');

    // Attempt to use Chrome 128 as specified in the bug report.
    // Selenium Manager should handle downloading it if possible.
    options.setBrowserVersion('128');

    const service = new chrome.ServiceBuilder()
      .loggingTo('chromedriver.log')
      .enableVerboseLogging();

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(service)
      .build();
  });

  afterEach(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('should not hang when subresource returns 401 with Basic Auth', async function () {
    // Set a timeout shorter than the default to catch the hang faster.
    // The bug report mentions a timeout occurring at ~10s.
    // We set it to 5s to fail quickly if it hangs.
    await driver.manage().setTimeouts({ pageLoad: 5000 });

    const url = `http://localhost:${port}/top`;
    console.log(`Navigating to ${url}`);
    
    // This navigation is expected to hang and timeout if the bug is present.
    // If fixed, it should complete immediately.
    await driver.get(url);
  });
});
