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
    # options.add_argument('--headless=new') 
    # options.add_argument('--no-sandbox')
    # options.add_argument('--disable-dev-shm-usage')
    # options.add_argument('--window-size=1280,1024')
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

      # Sleep. You can no longer interact with the browser page (try selecting text).
      sleep 100
    ensure
      driver.quit
    end
  end
end