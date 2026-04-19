const TEAM_COLORS: Record<string, string> = {
  "Red Bull Racing": "#1e5bc6",
  Ferrari: "#dc0000",
  Mercedes: "#00d2be",
  McLaren: "#ff8000",
  Aston: "#229971",
  Alpine: "#0090ff",
  RB: "#6692ff",
  Williams: "#37bedd",
  Sauber: "#52e252",
  Haas: "#b6babd"
};

const DRIVER_TEAM: Record<string, string> = {
  VER: "Red Bull Racing",
  PER: "Red Bull Racing",
  LEC: "Ferrari",
  SAI: "Ferrari",
  HAM: "Mercedes",
  RUS: "Mercedes",
  NOR: "McLaren",
  PIA: "McLaren",
  ALO: "Aston",
  STR: "Aston",
  GAS: "Alpine",
  OCO: "Alpine",
  TSU: "RB",
  RIC: "RB",
  ALB: "Williams",
  SAR: "Williams",
  BOT: "Sauber",
  ZHO: "Sauber",
  HUL: "Haas",
  MAG: "Haas"
};

const DEFAULT_ACCENT = "#7dd3fc";

export const inferDriverTeam = (code?: string, backendTeam?: string | null) => {
  if (backendTeam?.trim()) {
    return backendTeam.trim();
  }
  if (!code) {
    return null;
  }
  return DRIVER_TEAM[code.toUpperCase()] ?? null;
};

export const getTeamAccentColor = (team?: string | null): string => {
  if (!team) {
    return DEFAULT_ACCENT;
  }

  const match = Object.entries(TEAM_COLORS).find(([name]) =>
    team.toLowerCase().includes(name.toLowerCase())
  );
  return match?.[1] ?? DEFAULT_ACCENT;
};
