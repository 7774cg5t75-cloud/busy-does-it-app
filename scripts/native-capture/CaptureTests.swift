import XCTest
final class CaptureTests: XCTestCase {
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
  let done=expectation(description:"Apple screenshot")
  URLSession.shared.dataTask(with:URL(string:"http://127.0.0.1:8765/capture/"+name)!) { _,r,e in
   XCTAssertNil(e);XCTAssertEqual((r as? HTTPURLResponse)?.statusCode,200);done.fulfill()
  }.resume()
  wait(for:[done],timeout:30)
 }
 func testHomeAppearances() {
  continueAfterFailure=false;app.launch()
  let email=app.textFields["Email"]
  XCTAssertTrue(email.waitForExistence(timeout:60),"Original sign-in UI did not launch")
  email.tap();email.typeText(String(repeating:XCUIKeyboardKey.delete.rawValue,count:(email.value as? String ?? "").count));email.typeText("capture@example.invalid")
  let password=app.secureTextFields["Password"];password.tap();password.typeText("FictionalOnly123!")
  tap("Sign in")
  XCTAssertTrue(app.textFields["Ask BUSY"].waitForExistence(timeout:60),"Original Home failed to restore fictional workspace")
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
