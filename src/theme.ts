export const palette = {
  cream: '#FFF9EF', paper: '#FFFDFA', white: '#FFFFFF', ink: '#291D32',
  muted: '#62566C', line: '#EAE1D7', mango: '#FFDA62', hero: '#FFD658', coral: '#F78F78',
  plum: '#4C285C', lavender: '#F1E5FA', mint: '#DDF2E5', softMango: '#FFF0B9',
};
export const font = { regular: 'Nunito_600SemiBold', bold: 'Nunito_800ExtraBold', title: 'Nunito_900Black' };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, section: 36 };
export const radius = { control: 12, card: 20, hero: 28, pill: 999 };

export const colors = {
  canvas: palette.cream, surface: palette.paper, input: palette.white,
  text: palette.ink, textMuted: palette.muted, divider: palette.line,
  outline: '#8D8194', focus: palette.plum,
  primary: palette.ink, primaryHover: '#3C2B47', primaryPressed: palette.plum, onPrimary: palette.white,
  selected: palette.lavender, onSelected: palette.plum,
  hover: '#F6EFE6', pressed: '#EAE0D5',
  disabled: '#EEE8E1', onDisabled: '#746A7B',
  scrim: '#291D3277',
  error: '#A12C38', errorHover: '#8C2530', errorPressed: '#761E28', errorSurface: '#FCECEE',
  success: '#245D3D', successSurface: palette.mint,
  warning: '#745014', warningSurface: palette.softMango,
  info: palette.plum, infoSurface: palette.lavender,
};

export const control = { minimum: 48, icon: 18, border: 1 };
export const elevation = {
  sheet: { shadowColor: palette.ink, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 8 },
};

export const typography = {
  page: { size: 36, weight: 'title', color: palette.ink },
  section: { size: 28, weight: 'title', color: palette.ink },
  item: { size: 22, weight: 'title', color: palette.ink },
  body: { size: 16, weight: 'regular', color: palette.ink },
  value: { size: 16, weight: 'bold', color: palette.ink },
  label: { size: 14, weight: 'bold', color: palette.plum },
  detail: { size: 14, weight: 'regular', color: palette.muted },
  caption: { size: 13, weight: 'regular', color: palette.muted },
} as const;
