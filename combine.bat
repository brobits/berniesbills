#!/c/Ruby22/bin

require 'fileutils'
require 'json'

FileUtils.rm("data/bills.json", :force => true)

bills = Hash.new

Dir["data/bills/*.json"].each do |file|
  billName = File.basename(file).split('.').first
  jsonBillPath = "data/bills/#{billName}.json"
  json = JSON.parse(File.read(jsonBillPath))
  bills[billName] = json
end

Dir["data/bills/bernies/*.md"].each do |file|
  billName = File.basename(file).split('.').first
  markdownPath = "data/bills/bernies/#{billName}.md"
  markdownText = File.read(markdownPath).strip.gsub("\"","\"").gsub("\n", '\n')
  bills[billName]["bernie"] = markdownText
end

Dir["data/bills/summary/*.md"].each do |file|
  billName = File.basename(file).split('.').first
  summary = File.read(file).strip.gsub("\"","\"")
  bills[billName]["summary"] = summary
end

billArray = Array.new

bills.each do |billName, json|
  billArray.push(json)
end

combinedBillPath = "data/bills.json"
File.open(combinedBillPath, 'w') { |f| f.write(billArray.to_json) }
