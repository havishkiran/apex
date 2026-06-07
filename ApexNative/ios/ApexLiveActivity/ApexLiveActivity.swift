import ActivityKit
import SwiftUI
import WidgetKit

private let orange = Color(red: 1, green: 0.42, blue: 0.1)
private let bg = Color(red: 0.055, green: 0.063, blue: 0.078)

@available(iOS 16.2, *)
private func speedStr(_ kmh: Double, isKm: Bool) -> String {
    isKm ? "\(Int(kmh))" : "\(Int(kmh / 1.60934))"
}
@available(iOS 16.2, *)
private func speedUnit(_ isKm: Bool) -> String { isKm ? "KM/H" : "MPH" }
@available(iOS 16.2, *)
private func distStr(_ km: Double, isKm: Bool) -> String {
    isKm ? String(format: "%.2f km", km) : String(format: "%.2f mi", km / 1.60934)
}
@available(iOS 16.2, *)
private func topStr(_ kmh: Double, isKm: Bool) -> String {
    "Top \(isKm ? Int(kmh) : Int(kmh / 1.60934)) \(isKm ? "km/h" : "mph")"
}

// MARK: - Lock Screen / Notification Banner

@available(iOS 16.2, *)
struct ApexLockScreenView: View {
    let context: ActivityViewContext<ApexRideAttributes>

    var body: some View {
        HStack(alignment: .center, spacing: 0) {
            // Speed — large left column
            VStack(alignment: .leading, spacing: 2) {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(speedStr(context.state.speedKmh, isKm: context.attributes.isKm))
                        .font(.system(size: 56, weight: .black))
                        .foregroundColor(.white)
                        .minimumScaleFactor(0.5)
                        .lineLimit(1)
                    Text(speedUnit(context.attributes.isKm))
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(orange)
                        .offset(y: -4)
                }
                Text("SPEED")
                    .font(.system(size: 9, weight: .medium, design: .default))
                    .kerning(1.5)
                    .foregroundColor(.gray)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            // Right column: distance + elapsed + top speed
            VStack(alignment: .trailing, spacing: 10) {
                VStack(alignment: .trailing, spacing: 1) {
                    Text(distStr(context.state.distKm, isKm: context.attributes.isKm))
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(.white)
                    Text("DISTANCE")
                        .font(.system(size: 8, weight: .medium))
                        .kerning(1.2)
                        .foregroundColor(.gray)
                }
                VStack(alignment: .trailing, spacing: 1) {
                    Text(context.state.startDate, style: .timer)
                        .font(.system(size: 17, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.trailing)
                    Text("ELAPSED")
                        .font(.system(size: 8, weight: .medium))
                        .kerning(1.2)
                        .foregroundColor(.gray)
                }
                Text(topStr(context.state.maxSpeedKmh, isKm: context.attributes.isKm))
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(orange.opacity(0.85))
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .background(bg)
        .activityBackgroundTint(bg)
    }
}

// MARK: - Dynamic Island

@available(iOS 16.2, *)
struct ApexExpandedLeading: View {
    let context: ActivityViewContext<ApexRideAttributes>
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(speedStr(context.state.speedKmh, isKm: context.attributes.isKm))
                .font(.system(size: 40, weight: .black))
                .foregroundColor(.white)
            Text(speedUnit(context.attributes.isKm))
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(orange)
        }
        .padding(.leading, 4)
    }
}

@available(iOS 16.2, *)
struct ApexExpandedTrailing: View {
    let context: ActivityViewContext<ApexRideAttributes>
    var body: some View {
        VStack(alignment: .trailing, spacing: 6) {
            VStack(alignment: .trailing, spacing: 1) {
                Text(distStr(context.state.distKm, isKm: context.attributes.isKm))
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(.white)
                Text("dist")
                    .font(.system(size: 9))
                    .foregroundColor(.gray)
            }
            VStack(alignment: .trailing, spacing: 1) {
                Text(context.state.startDate, style: .timer)
                    .font(.system(size: 15, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
                Text("elapsed")
                    .font(.system(size: 9))
                    .foregroundColor(.gray)
            }
        }
        .padding(.trailing, 4)
    }
}

// MARK: - Widget Entry Point

@available(iOS 16.2, *)
struct ApexLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ApexRideAttributes.self) { context in
            ApexLockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    ApexExpandedLeading(context: context)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    ApexExpandedTrailing(context: context)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Image(systemName: "bicycle")
                            .foregroundColor(orange)
                            .font(.system(size: 12))
                        Text(context.attributes.rideName)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.gray)
                        Spacer()
                        Text(topStr(context.state.maxSpeedKmh, isKm: context.attributes.isKm))
                            .font(.system(size: 12))
                            .foregroundColor(orange.opacity(0.9))
                    }
                    .padding(.horizontal, 4)
                    .padding(.bottom, 4)
                }
            } compactLeading: {
                Image(systemName: "bicycle")
                    .foregroundColor(orange)
                    .font(.system(size: 12, weight: .semibold))
            } compactTrailing: {
                Text(speedStr(context.state.speedKmh, isKm: context.attributes.isKm))
                    .font(.system(size: 14, weight: .black))
                    .foregroundColor(orange)
            } minimal: {
                Image(systemName: "bicycle")
                    .foregroundColor(orange)
            }
        }
    }
}

// MARK: - Bundle

@available(iOS 16.2, *)
@main
struct ApexLiveActivityBundle: WidgetBundle {
    var body: some Widget {
        ApexLiveActivityWidget()
    }
}
