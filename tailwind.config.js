function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

module.exports = {
  theme: {
    backgroundColor: (theme) => ({
      ...theme('colors'),
      'gray-900-hue': `rgba(${hexToRgb(theme('colors.gray.900')).r},${hexToRgb(theme('colors.gray.900')).g},${hexToRgb(theme('colors.gray.900')).b}, 0.98)`,
      'gray-200-hue': `rgba(${hexToRgb(theme('colors.gray.200')).r},${hexToRgb(theme('colors.gray.200')).g},${hexToRgb(theme('colors.gray.200')).b}, 0.96)`,
    }),
  },
  variants: {
    backgroundColor: ['responsive', 'hover', 'focus', 'dark', 'dark-hover', 'dark-group-hover', 'dark-even', 'dark-odd'],
    borderColor: ['responsive', 'hover', 'focus', 'dark', 'dark-focus', 'dark-hover', 'dark-focus-within'],
    textColor: ['responsive', 'hover', 'focus', 'dark', 'dark-hover', 'dark-active'],
  },
  plugins: [
    require('@tailwindcss/custom-forms'),
    require('tailwindcss-dark-mode')(),
  ],
};
