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
require 'timeout'
require 'webrick'

RSpec.describe 'ChromeDriver Drag Freeze Reproduction' do
  before(:all) do
    # Exact HTML from the bug report
    @html = '<html> <body> <a href="https://google.com" draggable>foo</a> <div>qwe</div> </body> </html>'
    @server = WEBrick::HTTPServer.new(Port: 0, AccessLog: [], Logger: WEBrick::Log.new(File::NULL))
    @server.mount_proc '/' do |req, res|
      res.body = @html
      res['Content-Type'] = 'text/html'
    end
    @port = @server.config[:Port]
    @server_thread = Thread.new { @server.start }
  end

  after(:all) do
    @server.shutdown
    @server_thread.join
  end

  it 'should not freeze when dragging a draggable link' do
    options = Selenium::WebDriver::Options.chrome
    # Reporter says it happens in 143.0.7499.169. 
    # They suggest making it headfull, but in automated environments we try headless=new first.
    options.add_argument('--headless=new') 
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1280,1024')
    options.browser_version = 'stable'
    service = Selenium::WebDriver::Service.chrome(args: ['--verbose', '--log-path=chromedriver.log'])
    driver = Selenium::WebDriver.for :chrome, options: options, service: service

    begin
      driver.manage.timeouts.page_load = 10
      
      url = "http://localhost:#{@port}/"
      puts "Visiting #{url}"
      driver.navigate.to url

      link = driver.find_element(tag_name: 'a')
      div = driver.find_element(tag_name: 'div')
      
      puts "Attempting drag action (click_and_hold then move_by)..."
      
      # Exact sequence from the bug report:
      # sess.driver.browser.action.move_to(sess.find_link.native).click_and_hold.move_by(100, 100).perform
      driver.action.move_to(link).click_and_hold.move_by(100, 100).perform
      
      puts "Drag action 'perform' returned. Sleeping for 5 seconds..."
      sleep 5
      
      puts "Checking if browser is still responsive..."

      # If the bug is present, the reporter says the browser is "unusable".
      # We check this by trying to perform more actions.
      begin
        Timeout.timeout(10) do
          puts "Attempting to get title..."
          puts "Browser title: #{driver.title}"
          
          puts "Attempting to execute script..."
          driver.execute_script("return 1 + 1")
          
          puts "Attempting to interact with another element..."
          # Click the div. This should require the browser's main thread to be responsive.
          driver.action.move_to(div).click.perform
          
          puts "Attempting to navigate to about:blank..."
          driver.navigate.to "about:blank"
        end
      rescue Timeout::Error => e
        raise "REPRODUCED: Browser frozen! Subsequent commands failed after drag action. Error: #{e.message}"
      rescue => e
        raise "REPRODUCED: Browser in unusable state! Error: #{e.message}"
      end

      puts "Browser is still responsive. Reproduction failed."
    ensure
      driver.quit
    end
  end
end