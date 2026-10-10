export interface Profile {
  name: string;
  club: string;
  joinedAt: number;
}

export interface ClubNotification {
  id: string;
  title: string;
  text: string;
  href: string;
  type: string;
  date: number;
  read: boolean;
}

export interface SeasonProgress {
  levelLabel: string;
  currentXp: number;
  requiredXp: number;
  progress: number;
  completed: boolean;
}

export interface ClubSnapshot {
  profile: Profile;
  balance: number;
  notifications: ClubNotification[];
  season: SeasonProgress;
}
