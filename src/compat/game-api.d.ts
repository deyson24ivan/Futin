// Bridge for the existing saved-game events and browser APIs.
export {};
declare global {
  interface Window {
    FutinFormations: typeof import('../game/futin-formations').formationsApi;
    FutinPlayers: typeof import('../game/futin-players').playersApi;
    FutinClock: typeof import('../game/futin-core').clockApi;
    FutinProfile: typeof import('../game/futin-core').profileApi;
    FutinNotifications: typeof import('../game/futin-core').notificationsApi;
    FutinWallet: typeof import('../game/futin-core').walletApi;
    FutinSeasonPass: typeof import('../game/app').seasonPassApi;
    FutinIcons: typeof import('../game/futin-shell').iconsApi;
    FutinCardData: typeof import('../game/futin-card-data').cardDataApi;
    FutinCard: typeof import('../game/futin-card').cardApi;
    FutinPremium: typeof import('../game/futin-premium').premiumApi;
    FutinCareer: typeof import('../game/career/career-engine').careerApi;
    FutinTheme: typeof import('../game/futin-theme').themeApi;
  }
}
