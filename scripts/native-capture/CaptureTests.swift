import XCTest
final class CaptureTests: XCTestCase {
 let captureSourceCommit = "__BUSY_CAPTURE_SOURCE_SHA__"
 let app = XCUIApplication(bundleIdentifier: "com.busydoesit.capture")
 func element(_ label: String) -> XCUIElement { app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch }
 func tap(_ label: String) {
  let e=element(label)
  for _ in 0..<5 { if e.exists && e.isHittable { e.tap(); return }; app.swipeUp() }
  XCTFail("Required capture control unavailable: " + label)
 }
 func capture(_ name:String) {
  sleep(2)
  XCTAssertEqual(app.state,.runningForeground,"Capture requires the actual foreground app")
  let attachment = XCTAttachment(screenshot: app.screenshot())
  attachment.name = "busy-" + name + "-" + captureSourceCommit
  attachment.lifetime = .keepAlways
  add(attachment)
  print("CAPTURE attached=busy-" + name + "-" + captureSourceCommit)
 }
 func signInToOriginalHome() {
  continueAfterFailure=false
  XCTAssertEqual(captureSourceCommit.count,40,"Capture source must be bound before compilation")
  XCTAssertTrue(captureSourceCommit.allSatisfy { "0123456789abcdef".contains($0) })
  print("CAPTURE phase=app-launch")
  app.launch()
  let email=app.textFields["Email"]
  XCTAssertTrue(email.waitForExistence(timeout:60),"Original sign-in UI did not launch")
  email.tap();email.typeText(String(repeating:XCUIKeyboardKey.delete.rawValue,count:(email.value as? String ?? "").count));email.typeText("capture@example.invalid")
  let password=app.secureTextFields["Password"];password.tap();password.typeText("FictionalOnly123!")
  print("CAPTURE phase=original-sign-in")
  tap("Sign in")
  XCTAssertTrue(app.textFields["Ask BUSY"].waitForExistence(timeout:60),"Original Home failed to restore fictional workspace")
  print("CAPTURE phase=home-ready")
 }
 func testMidnightHome() {
  continueAfterFailure=false
  XCTAssertEqual(captureSourceCommit.count,40)
  print("CAPTURE phase=offline-owner-preview-launch")
  app.launch()
  XCTAssertTrue(app.textFields["Ask BUSY"].waitForExistence(timeout:60),"Original offline Owner Preview Home did not launch")
  XCTAssertTrue(app.textFields["Ask BUSY"].isHittable)
  XCTAssertEqual(app.alerts.count,0)
  capture("home-midnight")
  tap("Results")
  let mini=app.descendants(matching:.any).matching(identifier:"busy-floating-assistant").firstMatch
  XCTAssertTrue(mini.waitForExistence(timeout:30),"Actual floating control must exist separately from dock")
  let dock=app.descendants(matching:.any).matching(identifier:"busy-dock-assistant").firstMatch
  XCTAssertTrue(dock.exists)
  XCTAssertLessThan(mini.frame.maxY,dock.frame.maxY,"Floating and fixed assistant controls must be separate")
  capture("results-before-drag")
  let metric=element("Enquiries to follow up")
  XCTAssertTrue(metric.waitForExistence(timeout:10))
  let target=app.coordinate(withNormalizedOffset:CGVector(dx:0,dy:0)).withOffset(CGVector(dx:app.frame.maxX-36,dy:metric.frame.midY))
  mini.press(forDuration:0.2,thenDragTo:target)
  sleep(2)
  let selected=mini.frame.midY
  XCTAssertLessThan(abs(selected-metric.frame.midY),12,"Downward edge placement must remain at the noninteractive metric")
  capture("results-after-drag")
  tap("Settings")
  tap("About Busy Does It")
  XCTAssertTrue(element("Source commit").waitForExistence(timeout:10))
  capture("about-build")
  tap("Results")
  XCTAssertTrue(mini.waitForExistence(timeout:20))
  sleep(2)
  XCTAssertLessThan(abs(mini.frame.midY-selected),12,"Returning to Results must retain the preferred height")
 }

 func testHomeAppearances() {
  signInToOriginalHome()
  capture("home-midnight")
  tap("Settings");tap("Daylight appearance");tap("Home")
  XCTAssertTrue(app.textFields["Ask BUSY"].waitForExistence(timeout:30));capture("home-daylight")
  // Home in both modes is captured first. A later route failure retains those PNGs.
  tap("Settings");tap("Midnight appearance");tap("Home")
  for (label,header,name) in [
   ("Website Builder","Website Builder","website-builder-midnight"),
   ("App Builder","Business App Builder","app-builder-midnight"),
   ("Content Creator","Content Creator","content-creator-midnight"),
   ("Get More Customers","Get More Customers","get-more-customers-midnight"),
   ("Work & Customers","Work","work-customers-midnight")
  ] {
   tap("Home");XCTAssertTrue(app.textFields["Ask BUSY"].waitForExistence(timeout:30))
   tap(label);XCTAssertTrue(app.staticTexts[header].waitForExistence(timeout:30),"Original destination header absent: "+header)
   capture(name)
  }
  tap("Home");XCTAssertTrue(app.textFields["Ask BUSY"].waitForExistence(timeout:30));tap("Get Paid")
  let explanation=app.staticTexts["Get Paid · available now"]
  XCTAssertTrue(explanation.waitForExistence(timeout:10))
  for _ in 0..<3 { if explanation.isHittable { break };app.swipeUp() }
  capture("get-paid-explanation-midnight")
 }
}
