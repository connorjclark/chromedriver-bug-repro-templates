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

const { Builder, By } = require('selenium-webdriver');
const { expect } = require('expect');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');

describe('ChromeDriver Bug Reproduction: clear() missing input event', function () {
  let driver;
  this.timeout(5 * 60 * 1000);

  beforeEach(async function () {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
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

  /**
   * This test reproduces a known issue where ChromeDriver's clear() method
   * fails to fire the 'input' event. 
   * 
   * In modern frameworks like React, the 'input' event is used to sync the 
   * UI with internal state. If the event is missing, the framework may 
   * restore the previous value on the next render or blur event, effectively
   * undoing the clear().
   */
  it('should clear the input and trigger "input" event to stay in sync', async function () {
    const filePath = path.resolve(__dirname, 'repro.html');
    await driver.get('file://' + filePath);

    const input1 = await driver.findElement(By.id('input1'));
    const input2 = await driver.findElement(By.id('input2'));

    // 1. Type "First" into the first input
    await input1.sendKeys('First');
    
    // 2. Blur to ensure state is committed
    await input2.click();

    // 3. Clear the first input
    // EXPECTATION: clear() should fire 'input' event so state updates to ""
    await input1.clear();

    // 4. Type "Third"
    // If clear() failed to update internal state, the blur triggered by clear()
    // or the subsequent focus might have caused the framework to restore "First".
    await input1.sendKeys('Third');

    const value = await input1.getAttribute('value');
    
    // Log the browser events for debugging
    const logContent = await driver.findElement(By.id('log')).getText();
    console.log('--- Browser Event Log ---\n' + logContent + '\n-------------------------');

    // If the bug exists, value will be "FirstThird" instead of "Third"
    expect(value).toBe('Third');
  });
});
