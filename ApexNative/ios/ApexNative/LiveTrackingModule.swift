import Foundation
import ActivityKit

@objc(LiveTrackingModule)
class LiveTrackingModule: NSObject {

    @available(iOS 16.2, *)
    private var activity: Activity<ApexRideAttributes>?

    @objc func startActivity(
        _ rideName: String,
        isKm: Bool,
        startTimestampMs: Double,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard #available(iOS 16.2, *) else {
            reject("IOS_VERSION", "Live Activities require iOS 16.2+", nil)
            return
        }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            reject("DISABLED", "Live Activities disabled in Settings", nil)
            return
        }
        let attributes = ApexRideAttributes(
            rideName: rideName.isEmpty ? "Ride" : rideName,
            isKm: isKm
        )
        let startDate = Date(timeIntervalSince1970: startTimestampMs / 1000)
        let state = ApexRideAttributes.RideState(
            speedKmh: 0, distKm: 0, maxSpeedKmh: 0, startDate: startDate
        )
        do {
            let content = ActivityContent(state: state, staleDate: nil)
            activity = try Activity.request(attributes: attributes, content: content, pushType: nil)
            resolve(activity?.id ?? "")
        } catch {
            reject("START_FAILED", error.localizedDescription, error)
        }
    }

    @objc func updateActivity(_ speedKmh: Double, distKm: Double, maxSpeedKmh: Double) {
        guard #available(iOS 16.2, *) else { return }
        guard let current = activity else { return }
        let state = ApexRideAttributes.RideState(
            speedKmh: speedKmh,
            distKm: distKm,
            maxSpeedKmh: maxSpeedKmh,
            startDate: current.content.state.startDate
        )
        Task { await current.update(ActivityContent(state: state, staleDate: nil)) }
    }

    @objc func endActivity(_ speedKmh: Double, distKm: Double, maxSpeedKmh: Double) {
        guard #available(iOS 16.2, *) else { return }
        guard let current = activity else { return }
        let state = ApexRideAttributes.RideState(
            speedKmh: speedKmh,
            distKm: distKm,
            maxSpeedKmh: maxSpeedKmh,
            startDate: current.content.state.startDate
        )
        Task {
            await current.end(ActivityContent(state: state, staleDate: Date()), dismissalPolicy: .after(.now + 300))
        }
        activity = nil
    }

    @objc static func requiresMainQueueSetup() -> Bool { return false }
}
