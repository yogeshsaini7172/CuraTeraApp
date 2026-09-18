// YojnaMitra 4-Color Design System Tokens
// 1. Blue (Trust & Gov-Tech)
// 2. Orange (Voice Action & Hero CTA)
// 3. Green (Eligibility & Financial Benefit)
// 4. White (Card & Clean Readability)

export const Colors = {
  // 🟦 Blue Family
  blue: {
    dark: '#0A2540',     // Top Header background, primary brand text
    primary: '#1565C0',  // Links, interactive buttons, border outline
    light: '#EFF6FF',    // Light blue tint for tags
  },

  // 🟧 Orange Family (Vibrant Saffron Accent)
  orange: {
    primary: '#EA580C',  // Vibrant Saffron Orange
    light: '#FFF7ED',    // Light orange tint
    glow: 'rgba(234, 88, 12, 0.25)', // Pulsing wave around mic
  },

  // 🟩 Green Family (Benefit & Success)
  green: {
    primary: '#16A34A',  // 🟢 100% Eligible badge, ₹ amounts
    dark: '#15803D',     // Dark green for high-contrast text
    light: '#F0FDF4',    // Light green background badge
  },

  // ⬜ White / Neutral Family
  white: {
    pure: '#FFFFFF',     // Cards, modal backgrounds, text on buttons
    canvas: '#F8FAFC',   // Screen background (easy on eyes)
    border: '#E2E8F0',   // Thin outline border
    muted: '#64748B',    // Subtitle / inactive tab text
    textDark: '#0F172A', // High-contrast primary text (WCAG AAA)
  },
};
