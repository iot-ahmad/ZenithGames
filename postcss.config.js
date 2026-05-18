export default (ctx) => {
  // Only apply Tailwind and Autoprefixer to stylesheets located inside the "src" directory.
  // This prevents PostCSS from trying to compile pre-built game stylesheets in development.
  const isSrcCss = ctx.file && ctx.file.replace(/\\/g, '/').includes('/src/');
  return {
    plugins: isSrcCss ? {
      tailwindcss: {},
      autoprefixer: {},
    } : {},
  };
};
