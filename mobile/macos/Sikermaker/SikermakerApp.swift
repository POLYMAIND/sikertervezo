// Sikermaker — macOS-app (Mac App Store).
//
// Ugyanazt az appba csomagolt webes tervezőt futtatja, mint az iPhone-app (mobile/www), asztali elrendezéssel.
// A Capacitor iOS-keretrendszere nem fordítható Macre, ezért a natív részeket ez a kis app adja: a Bridge.swift
// ugyanazt a hídprotokollt beszéli, mint a Capacitor (PluginHeaders / nativePromise / nativeCallback), így a
// webes kód (vendor/capacitor.js + js/native.js) változtatás nélkül fut.
import SwiftUI
import UserNotifications

@main
struct SikermakerApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            WebContainer()
                .frame(minWidth: 960, minHeight: 640)
                // belépő / megerősítő / új jelszó levelek linkje (universal link: https://sikermaker.hu/app…)
                .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
                    if let url = activity.webpageURL { Bridge.shared.openURL(url) }
                }
                .onOpenURL { url in Bridge.shared.openURL(url) }
        }
        .defaultSize(width: 1280, height: 820)
        .commands {
            // egy ablak elég: a „Új ablak” menüpont nem kell (két ablak ugyanazt a tervet írná)
            CommandGroup(replacing: .newItem) {}
        }
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate, UNUserNotificationCenterDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        UNUserNotificationCenter.current().delegate = self
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    // az emlékeztető akkor is jelenjen meg, ha az app éppen előtérben van
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .list])
    }
}
