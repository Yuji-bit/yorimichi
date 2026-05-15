export type HookType = "REGULAR" | "RECENT";

export type Place = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  lat: number;
  lng: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  hooks?: Hook[];
  wikiEdits?: WikiEdit[];
};

export type Hook = {
  id: string;
  userId: string | null;
  placeId: string;
  message: string;
  tags: string[];
  hookType: HookType;
  isAnonymous: boolean;
  expiresAt: Date;
  createdAt: Date;
  user?: {
    handleName: string;
    interestTags: string[];
  } | null;
};

export type WikiEdit = {
  id: string;
  placeId: string;
  userId: string;
  content: string;
  createdAt: Date;
  user?: {
    handleName: string;
  };
};

export type UserProfile = {
  id: string;
  email: string;
  handleName: string;
  bio: string | null;
  interestTags: string[];
};
