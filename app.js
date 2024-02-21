const express = require("express");
const app = express();
const path = require("path");
app.use(express.json());
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

async function dbInitialise() {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server started on http://localhost:3000");
    });
  } catch (e) {
    console.log(` DB Error is ${e.message}`);
    process.exit(1);
  }
}
dbInitialise();

///All players details API
app.get("/players/", async (request, response) => {
  const playerDetails = await db.all(`SELECT * FROM player_details`);
  const filter = (player) => {
    return {
      playerId: player.player_id,
      playerName: player.player_name,
    };
  };
  response.send(playerDetails.map((eachplayer) => filter(eachplayer)));
});

///Player By ID API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const player = await db.get(
    `SELECT * FROM player_details WHERE player_id=${playerId}`
  );
  response.send({
    playerId: player.player_id,
    playerName: player.player_name,
  });
});

///Update Player By ID API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  await db.run(
    `UPDATE player_details
    SET player_name='${playerName}' WHERE player_id=${playerId};`
  );
  response.send("Player Details Updated");
});

///Get Match Details By ID API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const match = await db.get(
    `SELECT * FROM match_details WHERE match_id=${matchId}`
  );
  response.send({
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  });
});

///Matches Played By Player API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchDetails = await db.all(`
    SELECT match_id,match,year
     FROM
      match_details NATURAL JOIN player_match_score
       WHERE
       player_id = ${playerId};`);
  const disp = (matcH) => {
    return {
      matchId: matcH.match_id,
      match: matcH.match,
      year: matcH.year,
    };
  };
  response.send(matchDetails.map((match) => disp(match)));
});

///Players In a Match API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerDetails = await db.all(`
    SELECT player_id,player_name
     FROM
      player_details NATURAL JOIN player_match_score
       WHERE
       match_id = ${matchId};`);
  const disp = (player) => {
    return {
      playerId: player.player_id,
      playerName: player.player_name,
    };
  };
  response.send(playerDetails.map((player) => disp(player)));
});

///Player Scores by ID API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = await db.get(`
    SELECT player_id,player_name,sum(score),sum(fours),sum(sixes)
     FROM
      player_match_score NATURAL JOIN player_details
       WHERE
       player_id = ${playerId};`);
  response.send({
    playerId: playerDetails.player_id,
    playerName: playerDetails.player_name,
    totalScore: playerDetails["sum(score)"],
    totalFours: playerDetails["sum(fours)"],
    totalSixes: playerDetails["sum(sixes)"],
  });
});

module.exports = app;
