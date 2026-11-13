require 'xcodeproj'
root=ARGV.fetch(0)
p=Xcodeproj::Project.open(Dir[File.join(root,'ios','*.xcodeproj')].first)
app=p.targets.find{|t|t.product_type=='com.apple.product-type.application'}
raise 'Application target missing' unless app
ui=p.new_target(:ui_test_bundle,'BusyCaptureUITests',:ios,'16.0')
ui.add_dependency(app)
ui.product_reference.path='BusyCaptureUITests.xctest'
f=p.main_group.new_file(File.join(root,'scripts/native-capture/CaptureTests.swift'))
ui.source_build_phase.add_file_reference(f)
ui.build_configurations.each do |c|
 c.build_settings['PRODUCT_NAME']='BusyCaptureUITests'
 c.build_settings['PRODUCT_BUNDLE_IDENTIFIER']='com.busydoesit.capture.uitests'
 c.build_settings['GENERATE_INFOPLIST_FILE']='YES'
 c.build_settings['SWIFT_VERSION']='5.0'
 c.build_settings['TEST_TARGET_NAME']=app.name
 c.build_settings['CODE_SIGNING_ALLOWED']='NO'
end
p.save
s=Xcodeproj::XCScheme.new;s.add_build_target(app);s.add_test_target(ui);s.set_launch_target(app)
s.save_as(p.path,'BusyCapture')
