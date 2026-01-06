// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using System;
using System.IO;
using System.Linq;
using SeleniumExtras.WaitHelpers;

namespace RegressionTest;

public class Tests
{
    [Test]
    public void ShouldBeAbleToNavigateAfterDeletingNetworkConditions()
    {
        var options = new ChromeOptions();
        options.AddArgument("--headless");
        options.AddArgument("--no-sandbox");
        // By default, the test uses the latest stable Chrome version.
        // Replace the "stable" with the specific browser version if needed,
        // e.g. 'canary', '115' or '144.0.7534.0' for example.
        options.BrowserVersion = "stable";

        var service = ChromeDriverService.CreateDefaultService();
        service.LogPath = "chromedriver.log";
        service.EnableVerboseLogging = true;

        IWebDriver driver = new ChromeDriver(service, options);

        try
        {
            driver.Navigate().GoToUrl("https://www.google.com");
            Assert.That(driver.Title, Is.EqualTo("Google"));
        }
        finally
        {
            driver.Quit();
        }
    }

    [Test]
    [Repeat(20)]
    public void ShouldSwitchToNewWindowAndFindElementInHeadlessMode()
    {
        // This test reproduces the bug reported in https://issuetracker.google.com/issues/42323828
        // The bug describes an issue where Selenium cannot switch to a new tab and find an element
        // when Chrome is running in headless mode. This test is expected to fail if the bug is present.

        var options = new ChromeOptions();
        // The bug is specific to the new headless mode.
        options.AddArgument("--headless=new");
        options.AddArgument("--no-sandbox");
        options.BrowserVersion = "stable";

        var service = ChromeDriverService.CreateDefaultService();
        service.LogPath = "chromedriver.log";
        service.EnableVerboseLogging = true;

        IWebDriver driver = new ChromeDriver(service, options);
        WebDriverWait wait = new WebDriverWait(driver, TimeSpan.FromSeconds(20));

        try
        {
            // Get the full path to the index.html file
            string indexPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "index.html");
            driver.Navigate().GoToUrl("file://" + indexPath);

            string originalWindow = driver.CurrentWindowHandle;

            // Find and click the link to open a new tab
            IWebElement newTabLink = driver.FindElement(By.Id("new-tab-link"));
            newTabLink.Click();

            // Wait for the new window handle to appear
            wait.Until(d => d.WindowHandles.Count > 1);

            // Switch to the new window
            string newWindow = driver.WindowHandles.FirstOrDefault(handle => handle != originalWindow);
            driver.SwitchTo().Window(newWindow);

            // The bug occurs here: the driver fails to find the element in the new tab in headless mode.
            // We expect a NoSuchElementException or a timeout.
            IWebElement newTabElement = wait.Until(ExpectedConditions.ElementIsVisible(By.Id("new-tab-heading")));

            // The assertion will fail because the element is not found.
            // This confirms the presence of the bug.
            Assert.That(newTabElement.Displayed, Is.True);
        }
        finally
        {
            driver.Quit();
        }
    }
}
