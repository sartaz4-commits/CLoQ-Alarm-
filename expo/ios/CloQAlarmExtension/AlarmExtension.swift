// Created for CloQ AlarmKit integration — requires Apple entitlement com.apple.developer.alarmkit
import AlarmKit
import SwiftUI

struct AlarmExtensionView: View {
  let context: AlarmContext

  var body: some View {
    ZStack {
      Color(red: 0.063, green: 0.043, blue: 0.031)
        .ignoresSafeArea()

      VStack(spacing: 15) {
        ForEach(0..<40) { _ in
          Rectangle()
            .fill(Color(red: 0.91, green: 0.66, blue: 0.34).opacity(0.05))
            .frame(height: 0.5)
        }
      }
      .ignoresSafeArea()

      VStack(spacing: 24) {
        Spacer()

        Text(currentTimeString())
          .font(.custom("Georgia", size: 72))
          .fontWeight(.bold)
          .foregroundColor(Color(red: 0.96, green: 0.90, blue: 0.78))
          .kerning(-2)

        Text(currentDateString())
          .font(.system(size: 14, design: .monospaced))
          .foregroundColor(Color(red: 0.55, green: 0.27, blue: 0.08))
          .kerning(2)
          .textCase(.uppercase)

        Spacer()

        Text("CloQ")
          .font(.custom("Georgia", size: 22))
          .foregroundColor(Color(red: 0.91, green: 0.66, blue: 0.34))
          .kerning(-1)

        Text("The alarm that earns its dismiss")
          .font(.system(size: 11, design: .monospaced))
          .foregroundColor(Color(red: 0.55, green: 0.27, blue: 0.08))
          .kerning(1)

        Spacer()

        Button(action: {}) {
          Text("Open CloQ to dismiss")
            .font(.custom("Georgia", size: 16))
            .fontWeight(.medium)
            .foregroundColor(Color(red: 0.96, green: 0.90, blue: 0.78))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .background(Color(red: 0.165, green: 0.078, blue: 0.020))
            .cornerRadius(14)
            .overlay(
              RoundedRectangle(cornerRadius: 14)
                .stroke(Color(red: 0.77, green: 0.44, blue: 0.29), lineWidth: 0.75)
            )
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 48)
      }
    }
  }

  private func currentTimeString() -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "HH:mm"
    return formatter.string(from: Date())
  }

  private func currentDateString() -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "EEEE · d MMM"
    return formatter.string(from: Date())
  }
}
