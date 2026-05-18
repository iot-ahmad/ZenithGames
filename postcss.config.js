export default (ctx) => {
  // Check if the stylesheet belongs to a game subfolder
  const isGameCss = ctx.file && (
    ctx.file.includes('spell-caster') ||
    ctx.file.includes('multiplayer-neon-snake') ||
    ctx.file.includes('remix_-irbid-runner') ||
    ctx.file.includes('classic-two-player-chess') ||
    ctx.file.includes('snake-game_tcw')
  );

  if (isGameCss) {
    return {
      plugins: [], // EXPLICITLY USE AN EMPTY ARRAY to disable all PostCSS plugins for game assets!
    };
  }

  return {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  };
};
