/*
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.bidi.browsingcontext.BrowsingContext;
import org.openqa.selenium.bidi.browsingcontext.NavigationResult;
import org.openqa.selenium.bidi.browsingcontext.ReadinessState;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeDriverService;
import org.openqa.selenium.chrome.ChromeOptions;
import java.util.HashMap;
import java.util.Map;

public class RegressionTest {

  private WebDriver driver;

  @BeforeEach
  public void setUp() {
    ChromeOptions options = new ChromeOptions();
    options.addArguments("--headless");
    options.addArguments("--no-sandbox");

    // By default, the test uses the latest stable Chrome version.
    // Replace the "stable" with the specific browser version if needed,
    // e.g. 'canary', '115' or '144.0.7534.0' for example.
    options.setBrowserVersion("stable");

    ChromeDriverService service =
        new ChromeDriverService.Builder()
            .withLogFile(new java.io.File("chromedriver.log"))
            .withVerbose(true)
            .build();

    driver = new ChromeDriver(service, options);
  }

  @AfterEach
  public void tearDown() {
    if (driver != null) {
      driver.quit();
    }
  }

  @Test
  public void verifySetup_shouldBeAbleToNavigateToGoogleCom() {
    // Navigate to a URL
    driver.get("https://www.google.com");
    // Assert that the navigation was successful
    assertEquals("Google", driver.getTitle());
  }

  @Test
  public void testTimeoutExceptionInHeadlessBidi() {
    // Quit the driver initialized in @BeforeEach to start fresh with specific options
    if (driver != null) {
      driver.quit();
    }

    // Setup ChromeOptions
    ChromeOptions chromeOptions = new ChromeOptions();
    chromeOptions.setCapability("webSocketUrl", true);
    chromeOptions.addArguments("--headless=new");
    chromeOptions.addArguments("--no-sandbox"); // Good practice in CI environments

    Map<String, String> mobileEmulation = new HashMap<>();
    mobileEmulation.put("deviceName", "iPhone 12 Pro");

    chromeOptions.setExperimentalOption("mobileEmulation", mobileEmulation);

    // Create WebDriver
    driver = new ChromeDriver(chromeOptions);

    String url = "https://www.selenium.dev/documentation/webdriver/bidirectional/webdriver_bidi/";

    // Create BrowsingContext
    BrowsingContext browsingContext =
            new BrowsingContext(driver, driver.getWindowHandle());
    browsingContext.activate();

    // Navigate to the URL
    NavigationResult navigationResult =
            browsingContext.navigate(url, ReadinessState.COMPLETE);

    assertEquals(url, navigationResult.getUrl(), "User should see the webpage loaded successfully");

    // Find WebElement a[href='https://w3c.github.io/webdriver-bidi/']
    WebElement w3cBiDiLink =
            driver.findElement(new By.ByCssSelector("a[href='https://w3c.github.io/webdriver-bidi/']"));

    // Try to click WebElement - Expected to fail with TimeoutException if bug exists
    assertTrue(w3cBiDiLink.isDisplayed(), "User should see the WebDriver W3C link displayed!");
    w3cBiDiLink.click();
  }
}
