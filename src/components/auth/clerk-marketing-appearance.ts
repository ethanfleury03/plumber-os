export const clerkMarketingAppearance = {
  variables: {
    colorPrimary: '#3b82f6',
    colorBackground: 'rgba(15,23,42,0.95)',
    colorInputBackground: 'rgba(255,255,255,0.06)',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    card: 'bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl',
    headerTitle: 'text-white',
    headerSubtitle: 'text-slate-400',
    socialButtonsBlockButton: 'border-white/15 text-white',
    formButtonPrimary: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    footerActionLink: 'text-blue-400',
  },
} as const;
