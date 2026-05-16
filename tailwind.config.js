/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        lake:     '#344a57',
        charcoal: '#464d4f',
        slate:    '#8fa1ad',
        ceramic:  '#b1a39b',
        mist:     '#dadde1',
        navy:     '#1a2332',
        ink:      '#0f1623',
        gold:     '#c9a84c',
      },
    },
  },
  plugins: [],
}
