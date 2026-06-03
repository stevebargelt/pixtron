-- Seed MLB teams into league_teams.
--
-- Team IDs match the ESPN id space used by the Go scoreboard fetcher (GameSnapshot.Team.ID),
-- so favorite_teams entries will resolve correctly against live game data.

INSERT INTO league_teams (league_id, team_id, name, abbreviation, is_active) VALUES
  ((SELECT id FROM leagues WHERE code = 'mlb'), '1',  'Baltimore Orioles',      'BAL', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '2',  'Boston Red Sox',         'BOS', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '3',  'Los Angeles Angels',     'LAA', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '4',  'Chicago White Sox',      'CHW', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '5',  'Cleveland Guardians',    'CLE', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '6',  'Detroit Tigers',         'DET', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '7',  'Kansas City Royals',     'KC',  true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '8',  'Milwaukee Brewers',      'MIL', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '9',  'Minnesota Twins',        'MIN', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '10', 'New York Yankees',       'NYY', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '11', 'Athletics',              'ATH', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '12', 'Seattle Mariners',       'SEA', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '13', 'Texas Rangers',          'TEX', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '14', 'Toronto Blue Jays',      'TOR', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '15', 'Atlanta Braves',         'ATL', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '16', 'Chicago Cubs',           'CHC', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '17', 'Cincinnati Reds',        'CIN', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '18', 'Houston Astros',         'HOU', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '19', 'Los Angeles Dodgers',    'LAD', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '20', 'Washington Nationals',   'WSH', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '21', 'New York Mets',          'NYM', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '22', 'Philadelphia Phillies',  'PHI', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '23', 'Pittsburgh Pirates',     'PIT', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '24', 'St. Louis Cardinals',    'STL', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '25', 'San Diego Padres',       'SD',  true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '26', 'San Francisco Giants',   'SF',  true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '27', 'Colorado Rockies',       'COL', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '28', 'Miami Marlins',          'MIA', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '29', 'Arizona Diamondbacks',   'ARI', true),
  ((SELECT id FROM leagues WHERE code = 'mlb'), '30', 'Tampa Bay Rays',         'TB',  true)
ON CONFLICT (league_id, team_id) DO NOTHING;
