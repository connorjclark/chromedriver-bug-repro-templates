# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

require 'selenium-webdriver'
require 'rspec'

RSpec.describe 'ChromeDriver Drag Freeze Reproduction' do
  it 'should not freeze when dragging a draggable link' do
    options = Selenium::WebDriver::Options.chrome
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.browser_version = 'stable'
    service = Selenium::WebDriver::Service.chrome(args: ['--verbose', '--log-path=chromedriver.log'])
    driver = Selenium::WebDriver.for :chrome, options: options, service: service

    begin
      driver.manage.timeouts.page_load = 5 # Prevent long hang if it freezes during load (unlikely)
      
      # Load the reproduction HTML
      html = '<html> <body> <a href="https://google.com" draggable>foo</a> <div>qwe</div> </body> </html>'
      driver.navigate.to "data:text/html;charset=utf-8,#{html}"

      link = driver.find_element(tag_name: 'a')
      
      puts "Attempting drag action..."
      
      # sess.driver.browser.action.move_to(sess.find_link.native).click_and_hold.move_by(100, 100).perform
      driver.action.move_to(link).click_and_hold.move_by(100, 100).perform
      
      puts "Drag action completed."

      # If we reach here, we didn't freeze.
      expect(true).to be(true)
    ensure
      driver.quit
    end
  end
end
