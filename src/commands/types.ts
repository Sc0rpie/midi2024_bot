export type Team = {
    owner_id: string;
    team_name: string;
    points: number;
    locations_found: Array<string>;
    unlocked_groups: Array<string>;
    current_hints: Array<string>;
    skips: Array<number>;
    channel_id: string;
}

export type Teams = {
    teams: Array<Team>
}

export type Location = {
    id: string;
    name: string;
    points: number;
    hint: string;
    answer: string;
}

export type Group = {
    locations: Array<Location>;
    amount_of_locations: number;
}

