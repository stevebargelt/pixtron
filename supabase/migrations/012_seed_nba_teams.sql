-- Seed NBA teams into league_teams.
--
-- Team IDs match the ESPN id space used by the Go scoreboard fetcher (GameSnapshot.Team.ID),
-- so favorite_teams entries will resolve correctly against live game data.
-- IDs sourced from the ESPN basketball/nba/teams endpoint.

INSERT INTO league_teams (league_id, team_id, name, abbreviation, is_active) VALUES
  ((SELECT id FROM leagues WHERE code = 'nba'), '1',  'Atlanta Hawks',            'ATL',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '2',  'Boston Celtics',           'BOS',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '3',  'New Orleans Pelicans',     'NO',   true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '4',  'Chicago Bulls',            'CHI',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '5',  'Cleveland Cavaliers',      'CLE',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '6',  'Dallas Mavericks',         'DAL',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '7',  'Denver Nuggets',           'DEN',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '8',  'Detroit Pistons',          'DET',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '9',  'Golden State Warriors',    'GS',   true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '10', 'Houston Rockets',          'HOU',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '11', 'Indiana Pacers',           'IND',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '12', 'LA Clippers',              'LAC',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '13', 'Los Angeles Lakers',       'LAL',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '14', 'Miami Heat',               'MIA',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '15', 'Milwaukee Bucks',          'MIL',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '16', 'Minnesota Timberwolves',   'MIN',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '17', 'Brooklyn Nets',            'BKN',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '18', 'New York Knicks',          'NY',   true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '19', 'Orlando Magic',            'ORL',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '20', 'Philadelphia 76ers',       'PHI',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '21', 'Phoenix Suns',             'PHX',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '22', 'Portland Trail Blazers',   'POR',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '23', 'Sacramento Kings',         'SAC',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '24', 'San Antonio Spurs',        'SA',   true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '25', 'Oklahoma City Thunder',    'OKC',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '26', 'Utah Jazz',                'UTAH', true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '27', 'Washington Wizards',       'WSH',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '28', 'Toronto Raptors',          'TOR',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '29', 'Memphis Grizzlies',        'MEM',  true),
  ((SELECT id FROM leagues WHERE code = 'nba'), '30', 'Charlotte Hornets',        'CHA',  true)
ON CONFLICT (league_id, team_id) DO NOTHING;
