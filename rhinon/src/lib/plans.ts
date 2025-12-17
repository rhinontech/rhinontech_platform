export const PLAN_LIMITS: {
  [key: string]: {
    file: number;
    article: number;
    websites: number;
    tokens: number;
    knowledge: number;
    users: number;
    campaigns: number;
  };
} = {
  Starter: {
    file: 3,
    article: 3,
    websites: 3,
    tokens: 500000,
    knowledge: 10,
    users: 5,
    campaigns: 3,
  },
  Growth: {
    file: 6,
    article: 6,
    websites: 6,
    tokens: 1000000,
    knowledge: 5,
    users: 15,
    campaigns: 5,
  },
  Scale: {
    file: 10,
    article: 10,
    websites: 10,
    tokens: 2000000,
    knowledge: 999,
    users: 999,
    campaigns: 10,
  },
};

// Add aliases after definition
PLAN_LIMITS["Trial"] = PLAN_LIMITS["Starter"];
PLAN_LIMITS["Free"] = PLAN_LIMITS["Starter"];
