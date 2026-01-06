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
const { expect } = require('expect');
const chrome = require('selenium-webdriver/chrome');

describe('Selenium ChromeDriver', function () {
  let driver;
  // The chrome and chromedriver installation can take some time. 
  // Give 5 minutes to install everything.
  this.timeout(5 * 60 * 1000);

  beforeEach(async function () {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');

    // By default, the test uses the latest stable Chrome version.
    // Replace the "stable" with the specific browser version if needed,
    // e.g. 'canary', '115' or '144.0.7534.0' for example.
    options.setBrowserVersion('stable');

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
    await driver.quit();
  });

  it('should clear the input field correctly', async function () {
    const url = 'https://sandbox.mabl.com/mailbox';
    await driver.get(url);

    const { By } = require('selenium-webdriver');

    // XPaths from the bug report
    const input1Xpath = '/html/body/div/div[2]/div/div[2]/form/div/div[1]/div/input';
    const input2Xpath = '/html/body/div/div[2]/div/div[2]/form/div/div[2]/div/input';

    const input1 = await driver.findElement(By.xpath(input1Xpath));
    await input1.click();
    await input1.sendKeys('First');

    const input2 = await driver.findElement(By.xpath(input2Xpath));
    await input2.click();
    await input2.sendKeys('Second');

    // Go back to first input, clear and type "Third"
    await input1.click();
    await input1.clear();
    await input1.sendKeys('Third');

    const value = await input1.getAttribute('value');
    // If the bug exists, clear() might have failed, leaving previous text or not handling the state change.
    // We expect "Third" if clear() works.
    expect(value).toBe('Third');
  });
});
