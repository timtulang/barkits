export const palette = {
  cream: '#FFF9EF', paper: '#FFFDFA', white: '#FFFFFF', ink: '#281934',
  muted: '#6D536F', line: '#EAE1D7', mango: '#FFCD45', hero: '#FFD24F', coral: '#FF795E',
  plum: '#43217E', lavender: '#F2E4FF', mint: '#DDF2E5', softMango: '#FFF0B9',
};
export const font = { regular: 'Nunito_600SemiBold', bold: 'Nunito_800ExtraBold', title: 'Nunito_900Black' };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, section: 36 };
export const radius = { control: 12, card: 16, hero: 24, pill: 999 };

export const colors = {
  canvas: palette.cream, surface: palette.paper, input: palette.white,
  text: palette.ink, textMuted: palette.muted, divider: palette.line,
  outline: '#85708D', focus: palette.plum,
  primary: '#582AA0', primaryHover: '#6D36B8', primaryPressed: palette.plum, onPrimary: palette.white,
  progressCurrent: palette.mango, progressComplete: palette.plum, onProgressCurrent: palette.ink,
  selected: palette.lavender, onSelected: palette.plum,
  hover: '#F7EDF9', pressed: '#EADAF5',
  disabled: '#EEE6EF', onDisabled: '#665670',
  scrim: '#28193477',
  error: '#A12C38', errorHover: '#8C2530', errorPressed: '#761E28', errorSurface: '#FCECEE',
  success: '#245D3D', successSurface: palette.mint,
  warning: '#745014', warningSurface: palette.softMango,
  info: palette.plum, infoSurface: palette.lavender,
};

export const control = { minimum: 48, icon: 18, border: 1 };
export const motion = {
  stage: { duration: 150, curve: [0.22, 0.61, 0.36, 1] },
  arrival: { duration: 220, curve: [0.16, 1, 0.3, 1] },
  celebrationRise: { duration: 130, curve: [0.25, 0.46, 0.45, 0.94] },
  celebrationSettle: { duration: 170, curve: [0.455, 0.03, 0.515, 0.955] },
} as const;
export const elevation = {
  sheet: { shadowColor: palette.ink, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 8 },
};

export const typography = {
  page: { size: 40, weight: 'title', color: palette.ink },
  section: { size: 28, weight: 'title', color: palette.ink },
  item: { size: 22, weight: 'title', color: palette.ink },
  body: { size: 16, weight: 'regular', color: palette.ink },
  value: { size: 16, weight: 'bold', color: palette.ink },
  label: { size: 14, weight: 'bold', color: palette.plum },
  detail: { size: 14, weight: 'regular', color: palette.muted },
  caption: { size: 13, weight: 'regular', color: palette.muted },
} as const;
