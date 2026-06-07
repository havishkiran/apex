import ActivityKit
import Foundation

// Shared between main app target and ApexLiveActivity widget extension.
// In Xcode: select this file → File Inspector → check BOTH targets.
@available(iOS 16.2, *)
struct ApexRideAttributes: ActivityAttributes {
    public typealias ContentState = RideState

    public struct RideState: Codable, Hashable {
        var speedKmh: Double
        var distKm: Double
        var maxSpeedKmh: Double
        var startDate: Date  // SwiftUI Text timer ticks this automatically
    }

    var rideName: String
    var isKm: Bool
}
