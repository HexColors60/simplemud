const net = require('net');
const fs = require('fs');
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

const Util = require(path.join(__dirname, '..', 'src', 'Util'));
const Connection = require(path.join(__dirname, '..', 'src', 'Connection'));
const { itemDb, playerDb, roomDb, storeDb } =
  require(path.join(__dirname, '..', 'src', 'Databases'));
const { Attribute, PlayerRank, Direction } =
  require(path.join(__dirname, '..', 'src', 'Attributes'));
const telnet = require(path.join(__dirname, '..', 'src', 'Telnet'));
const Player = require(path.join(__dirname, '..', 'src', 'Player'));
const Room = require(path.join(__dirname, '..', 'src', 'Room'));
const Store = require(path.join(__dirname, '..', 'src', 'Store'));
const Game = require(path.join(__dirname, '..', 'src', 'Game'));

const tostring = Util.tostring;

describe("Game", () => {
  const conn = new Connection(new net.Socket(), telnet);
  const cc = telnet.cc;
  let game, player, stubSocketSend;
  beforeEach(() => {
    player = new Player();
    game = new Game(conn, player);
    player.connection = conn;
    stubSocketSend = sinon.stub(conn.socket, 'write').callsFake();
    playerDb.add(player);
  });

  afterEach(() => {
    playerDb.map.delete(player.id);
    conn.socket.write.restore();
  });

  it("should properly return whether game is running", () => {
    expect(Game.isRunning()).to.be.false;
  });

  it("should properly set flag of whether game is running", () => {
    Game.setIsRunning(false);
    expect(Game.isRunning()).to.be.false;
    Game.setIsRunning(true);
    expect(Game.isRunning()).to.be.true;
    Game.setIsRunning(false);
    expect(Game.isRunning()).to.be.false;
  });

  describe("handle()", () => {

    let stubSendRoom;
    beforeEach(() => {
      stubSendRoom = sinon.stub(Game, 'sendRoom').callsFake();
    });

    afterEach(() => {
      Game.sendRoom.restore();
    })

    // ------------------------------------------------------------------------
    //  REGULAR access commands
    // ------------------------------------------------------------------------

    it("should properly handle 'chat' commands", () => {
      const stub = stubSocketSend;
      sinon.stub(player, 'printStatbar').callsFake();
      const p = player;
      p.active = p.loggedIn = true;
      let expectedMsg = cc('white') + cc('bold') +
      `${p.name} chats: Hello there!` +
      cc('reset') + cc('white') + cc('reset') +
      cc('newline');
      game.handle('chat Hello there!');
      expect(stub.getCall(0).args[0]).to.equal(expectedMsg);
      game.handle(': Hello there!');
      expect(stub.getCall(1).args[0]).to.equal(expectedMsg);
      player.printStatbar.restore();
    });

    it("should properly handle 'experience' command", () => {
      const spyPrintExp = sinon.spy(game, 'printExperience');
      const spySendStr = sinon.spy(player, 'sendString');
      game.handle("experience");
      expect(spyPrintExp.calledOnce).to.be.true;
      expect(spySendStr.calledOnce).to.be.true;
      player.sendString.restore();
      game.printExperience.restore();
    });

    it("should properly handle 'exp' command", () => {
      const spyPrintExp = sinon.spy(game, 'printExperience');
      const spySendStr = sinon.spy(player, 'sendString');
      game.handle("exp");
      expect(spyPrintExp.calledOnce).to.be.true;
      expect(spySendStr.calledOnce).to.be.true;
      player.sendString.restore();
      game.printExperience.restore();
    });

    it("should properly handle 'help' command", () => {
      const spyPrintHelp = sinon.spy(Game, 'printHelp');
      const spySendStr = sinon.spy(player, 'sendString');
      game.handle("help");
      expect(spyPrintHelp.calledOnce).to.be.true;
      expect(spySendStr.calledOnce).to.be.true;
      player.sendString.restore();
      Game.printHelp.restore();
    });

    it("should properly handle 'commands' command", () => {
      const spyPrintHelp = sinon.spy(Game, 'printHelp');
      const spySendStr = sinon.spy(player, 'sendString');
      game.handle("help");
      expect(spyPrintHelp.calledOnce).to.be.true;
      expect(spySendStr.calledOnce).to.be.true;
      player.sendString.restore();
      Game.printHelp.restore();
    });

    it("should properly handle 'inventory' command", () => {
      const spyPrintInv = sinon.spy(game, 'printInventory');
      const spySendStr = sinon.spy(player, 'sendString');
      game.handle("inventory");
      expect(spyPrintInv.calledOnce).to.be.true;
      expect(spySendStr.calledOnce).to.be.true;
      player.sendString.restore();
      game.printInventory.restore();
    });

    it("should properly handle 'inv' command", () => {
      const spyPrintInv = sinon.spy(game, 'printInventory');
      const spySendStr = sinon.spy(player, 'sendString');
      game.handle("inv");
      expect(spyPrintInv.calledOnce).to.be.true;
      expect(spySendStr.calledOnce).to.be.true;
      player.sendString.restore();
      game.printInventory.restore();
    });

    it("should properly handle 'quit' command", () => {
      const stubCloseConn = sinon.stub(conn, 'close').callsFake();
      const stubLogoutMsg = sinon.stub(Game, 'logoutMessage').callsFake();
      const expectedMsg = player.name + " has left the realm.";
      game.handle('quit');
      expect(stubCloseConn.calledOnce).to.be.true;
      expect(stubLogoutMsg.getCall(0).args[0]).to.equal(expectedMsg);
      Game.logoutMessage.restore();
      conn.close.restore();
    });

    it("should properly handle 'remove' command", () => {
      const spy = sinon.spy(game, 'removeItem');
      game.handle('remove armor');
      expect(spy.calledOnce).to.be.true;
      expect(spy.getCall(0).args[0]).to.equal("armor");
      game.removeItem.restore();
    });

    it("should properly handle 'stats' command", () => {
      const spy = sinon.spy(game, 'printStats');
      game.handle('stats');
      expect(spy.calledOnce).to.be.true;
      game.printStats.restore();
    });

    it("should properly handle 'st' command", () => {
      const spy = sinon.spy(game, 'printStats');
      game.handle('st');
      expect(spy.calledOnce).to.be.true;
      game.printStats.restore();
    });

    it("should properly handle 'time' command", () => {
      const expectedMsg = cc('bold') + cc('cyan') +
        "The current system time is: " + Util.timeStamp() +
        " on " + Util.dateStamp() + cc('newline') +
        "The system has been up for: " + Util.upTime() +
        "." + cc('reset') + cc('bold') + cc('reset') +
        cc('newline');
      game.handle('time');
      expect(stubSocketSend.getCall(0).args[0]).to.be.
        equal(expectedMsg);
    });

    it("should properly handle 'use' command", () => {
      const spy = sinon.spy(game, 'useItem');
      game.handle('use high potion');
      expect(spy.calledOnce).to.be.true;
      expect(spy.getCall(0).args[0]).to.equal("high potion");
      game.useItem.restore();
    });

    it("should properly handle 'whisper' command", () => {
      const spy = sinon.spy(game, 'whisper');
      game.handle('whisper test Hello there!');
      expect(spy.calledOnce).to.be.true;
      expect(spy.getCall(0).args).to.
        have.same.members(['Hello there!', 'test']);
      game.whisper.restore();
    });

    it("should properly handle 'who' command", () => {
      const spy = sinon.spy(Game, 'whoList');
      game.handle('who');
      expect(spy.calledOnce).to.be.true;
      expect(spy.getCall(0).args[0]).to.equal('');
      game.handle('who all');
      expect(spy.getCall(1).args[0]).to.equal('all');
      Game.whoList.restore();
    });

    it("should properly handle 'look' command", () => {
      player.room = roomDb.findByNameFull("Training Room");
      const spy = sinon.spy(Game, 'printRoom');
      game.handle('look');
      expect(spy.calledOnce).to.be.true;
      Game.printRoom.restore();
    });

    it("should properly handle 'l' command", () => {
      player.room = roomDb.findByNameFull("Training Room");
      const spy = sinon.spy(Game, 'printRoom');
      game.handle('l');
      expect(spy.calledOnce).to.be.true;
      Game.printRoom.restore();
    });

    it("should properly handle 'north' command", () => {
      const stub = sinon.stub(game, 'move').callsFake();
      game.handle('North');
      expect(stub.getCall(0).args[0]).to.
        equal(Direction.NORTH);
      game.move.restore();
    });

    it("should properly handle 'n' command", () => {
      const stub = sinon.stub(game, 'move').callsFake();
      game.handle('n');
      expect(stub.getCall(0).args[0]).to.
        equal(Direction.NORTH);
      game.move.restore();
    });

    it("should properly handle 'east' command", () => {
      const stub = sinon.stub(game, 'move').callsFake();
      game.handle('East');
      expect(stub.getCall(0).args[0]).to.
        equal(Direction.EAST);
      game.move.restore();
    });

    it("should properly handle 'e' command", () => {
      const stub = sinon.stub(game, 'move').callsFake();
      game.handle('e');
      expect(stub.getCall(0).args[0]).to.
        equal(Direction.EAST);
      game.move.restore();
    });

    it("should properly handle 'south' command", () => {
      const stub = sinon.stub(game, 'move').callsFake();
      game.handle('South');
      expect(stub.getCall(0).args[0]).to.
        equal(Direction.SOUTH);
      game.move.restore();
    });

    it("should properly handle 's' command", () => {
      const stub = sinon.stub(game, 'move').callsFake();
      game.handle('s');
      expect(stub.getCall(0).args[0]).to.
        equal(Direction.SOUTH);
      game.move.restore();
    });

    it("should properly handle 'west' command", () => {
      const stub = sinon.stub(game, 'move').callsFake();
      game.handle('West');
      expect(stub.getCall(0).args[0]).to.
        equal(Direction.WEST);
      game.move.restore();
    });

    it("should properly handle 'w' command", () => {
      const stub = sinon.stub(game, 'move').callsFake();
      game.handle('West');
      expect(stub.getCall(0).args[0]).to.
        equal(Direction.WEST);
      game.move.restore();
    });

    it("should properly handle 'get' command", () => {
      const stub = sinon.stub(game, 'getItem').callsFake();
      game.handle('get sword');
      expect(stub.getCall(0).args[0]).to.
        equal('sword');
      game.getItem.restore();
    });

    it("should properly handle 'take' command", () => {
      const stub = sinon.stub(game, 'getItem').callsFake();
      game.handle('take sword');
      expect(stub.getCall(0).args[0]).to.
        equal('sword');
      game.getItem.restore();
    });

    it("should properly handle 'drop' command", () => {
      const stub = sinon.stub(game, 'dropItem').callsFake();
      game.handle('drop healing potion');
      expect(stub.getCall(0).args[0]).to.
        equal('healing potion');
      game.dropItem.restore();
    });

    it("should properly handle 'train' command", () => {
      const p = player;
      const stub = sinon.stub(p, 'sendString').callsFake();
      p.experience = 0;

      p.room = roomDb.findByNameFull("Avenue");
      game.handle('train');
      expect(stub.getCall(0).args[0]).to.
      equal("<red><bold>You cannot train here!</bold></red>");

      p.room = roomDb.findByNameFull("Training Room");
      game.handle('train');
      expect(stub.getCall(1).args[0]).to.
        equal("<red><bold>You don't have enough " +
              "experience to train!</bold></red>");

      p.experience = 40;
      game.handle('train');
      expect(stub.getCall(2).args[0]).to.
        equal("<green><bold>You are now level 2</bold></green>");

      p.sendString.restore();
    });

    it("should properly handle 'editstats' command", () => {
      const p = player;
      const stubSendString = sinon.stub(p, 'sendString').callsFake();
      const stubGoToTrain = sinon.stub(game, 'goToTrain').callsFake();
      p.experience = 0;

      p.room = roomDb.findByNameFull("Avenue");
      game.handle('editstats');
      expect(stubSendString.getCall(0).args[0]).to.
      equal("<red><bold>You cannot edit your stats here!</bold></red>");
      expect(stubGoToTrain.calledOnce).to.be.false;

      p.room = roomDb.findByNameFull("Training Room");
      game.handle('editstats');
      expect(stubGoToTrain.calledOnce).to.be.true;

      p.sendString.restore();
      game.goToTrain.restore();
    });

    it("should properly handle 'list' command", () => {
      const p = player;
      const spySendStr = sinon.spy(p, 'sendString');
      const spyStoreList = sinon.spy(Game, 'storeList');

      p.room = roomDb.findByNameFull("Avenue");
      game.handle('list');
      expect(spySendStr.getCall(0).args[0]).to.
        equal("<red><bold>You're not in a store!</bold></red>");
      expect(spyStoreList.calledOnce).to.be.false;

      p.room = roomDb.findByNameFull("Bobs Weapon Shop");
      game.handle('list');
      expect(spySendStr.getCall(1).args[0]).to.have.
        string("Rusty Knife");
      expect(spyStoreList.calledOnce).to.be.true;

      p.sendString.restore();
      Game.storeList.restore();
    });

    it("should properly handle 'buy' command", () => {
      const p = player;
      const spySendStr = sinon.spy(p, 'sendString');
      const stubBuy = sinon.stub(game, 'buy').callsFake();

      p.room = roomDb.findByNameFull("Avenue");
      game.handle('buy shortsword');
      expect(spySendStr.getCall(0).args[0]).to.
        equal("<red><bold>You're not in a store!</bold></red>");
      expect(stubBuy.calledOnce).to.be.false;

      p.room = roomDb.findByNameFull("Bobs Weapon Shop");
      game.handle('buy shortsword');
      expect(stubBuy.calledOnce).to.be.true;
      expect(stubBuy.getCall(0).args[0]).to.equal("shortsword");

      p.sendString.restore();
      game.buy.restore();
    });

    it("should properly handle 'sell' command", () => {
      const p = player;
      const spySendStr = sinon.spy(p, 'sendString');
      const stubSell = sinon.stub(game, 'sell').callsFake();

      p.room = roomDb.findByNameFull("Avenue");
      game.handle('sell shortsword');
      expect(spySendStr.getCall(0).args[0]).to.
        equal("<red><bold>You're not in a store!</bold></red>");
      expect(stubSell.calledOnce).to.be.false;

      p.room = roomDb.findByNameFull("Bobs Weapon Shop");
      game.handle('sell shortsword');
      expect(stubSell.calledOnce).to.be.true;
      expect(stubSell.getCall(0).args[0]).to.equal("shortsword");

      p.sendString.restore();
      game.sell.restore();
    });

    // ------------------------------------------------------------------------
    //  GOD access commands
    // ------------------------------------------------------------------------

    it("should properly handle 'kick' command", () => {
      const stubLogoutMsg = sinon.stub(Game, 'logoutMessage').callsFake();
      const stubConnClose = sinon.stub(conn, 'close').callsFake();
      const spyFindLoggedIn = sinon.spy(playerDb, 'findLoggedIn');
      const spySendStr = sinon.spy(player, 'sendString');
      const admin = new Player();
      admin.name = "TestAdmin";
      admin.rank = PlayerRank.ADMIN;
      admin.loggedIn = true;
      playerDb.add(admin);

      const testPlayer = new Player();
      testPlayer.name = "TestPlayer";
      testPlayer.rank = PlayerRank.REGULAR;
      testPlayer.loggedIn = true;
      testPlayer.connection = conn;
      playerDb.add(testPlayer);

      game.handle("kick someuser");
      expect(spyFindLoggedIn.calledOnce).to.be.false; // no priviledge

      player.rank = PlayerRank.GOD;
      game.handle("kick someuser");
      expect(spySendStr.getCall(0).args[0]).to.
        have.string("Player could not be found");

      game.handle("kick ");
      expect(spySendStr.getCall(1).args[0]).to.
        have.string("Usage: kick <name>");

      game.handle("kick " + testPlayer.name);
      expect(stubConnClose.calledOnce).to.be.true;
      expect(stubLogoutMsg.getCall(0).args[0]).to.have.
        string(testPlayer.name + " has been kicked");

      game.handle("kick " + admin.name);
      expect(spySendStr.getCall(2).args[0]).to.
        have.string("You can't kick that player!");

      playerDb.map.delete(testPlayer.id);
      playerDb.map.delete(admin.id);

      player.sendString.restore();
      playerDb.findLoggedIn.restore();
      conn.close.restore();
      Game.logoutMessage.restore();
    });

    // ------------------------------------------------------------------------
    //  ADMIN access commands
    // ------------------------------------------------------------------------

    it("should properly handle 'announce' command", () => {
      const spy = sinon.spy(Game, 'announce');
      const p = player;
      p.rank = PlayerRank.REGULAR;
      game.handle("announce Test announcement!");
      expect(spy.calledOnce).to.be.false;
      p.rank = PlayerRank.GOD;
      game.handle("announce Test announcement!");
      expect(spy.calledOnce).to.be.false;
      p.rank = PlayerRank.ADMIN;
      game.handle("announce Test announcement!");
      expect(spy.calledOnce).to.be.true;
      expect(spy.getCall(0).args[0]).to.
        equal("Test announcement!");
      Game.announce.restore();
    });

    it("should properly handle 'changerank' command", () => {
      const spySendGame = sinon.spy(Game, 'sendGame');
      const spySendStr = sinon.spy(player, 'sendString');
      const spyFindNameFull = sinon.spy(playerDb, 'findByNameFull');
      const p = player;
      const testPlayer = new Player();
      testPlayer.name = "TestPlayer";
      testPlayer.rank = PlayerRank.REGULAR;
      playerDb.add(testPlayer);

      p.rank = PlayerRank.REGULAR;
      game.handle("changerank " + testPlayer.name + " god");
      expect(spyFindNameFull.calledOnce).to.be.false;
      p.rank = PlayerRank.GOD;
      game.handle("changerank " + testPlayer.name + " god");
      expect(spyFindNameFull.calledOnce).to.be.false;
      p.rank = PlayerRank.ADMIN;
      game.handle("changerank " + testPlayer.name + " god");
      expect(spyFindNameFull.calledOnce).to.be.true
      expect(spySendGame.getCall(0).args[0]).to.have.
        string("rank has been changed to: GOD");
      game.handle("changerank " + testPlayer.name + " Regular");
      expect(spySendGame.getCall(1).args[0]).to.have.
        string("rank has been changed to: REGULAR");
      game.handle("changerank " + testPlayer.name + " ADMIN");
      expect(spySendGame.getCall(2).args[0]).to.have.
        string("rank has been changed to: ADMIN");

      game.handle("changerank InvalidPlayer god");
      expect(spySendStr.getCall(0).args[0]).to.have.
        string("Could not find user");

      game.handle("changerank " + testPlayer.name);
      expect(spySendStr.getCall(1).args[0]).to.have.
        string("Usage: changerank <name> <rank>");

      game.handle("changerank");
      expect(spySendStr.getCall(2).args[0]).to.have.
        string("Usage: changerank <name> <rank>");

      playerDb.map.delete(testPlayer.id);
      playerDb.findByNameFull.restore();
      player.sendString.restore();
      Game.sendGame.restore();
    });

    it("should properly handle 'reload' command", () => {
      const stubLoadItemDb = sinon.stub(itemDb, 'load').callsFake();
      const stubLoadRoomDb = sinon.stub(roomDb, 'loadTemplates').callsFake();
      const stubLoadStoreDb = sinon.stub(storeDb, 'load').callsFake();
      const spySendStr = sinon.spy(player, 'sendString');
      const p = player;

      p.rank = PlayerRank.REGULAR;
      game.handle("reload items");
      expect(spySendStr.calledOnce).to.be.false;

      p.rank = PlayerRank.GOD;
      game.handle("reload items");
      expect(spySendStr.calledOnce).to.be.false;

      p.rank = PlayerRank.ADMIN;
      expect(stubLoadItemDb.calledOnce).to.be.false;
      game.handle("reload items");
      expect(spySendStr.calledOnce).to.be.true;
      expect(spySendStr.getCall(0).args[0]).to.have.
        string("Item Database Reloaded!");
      expect(stubLoadItemDb.calledOnce).to.be.true;

      expect(stubLoadRoomDb.calledOnce).to.be.false;
      game.handle("reload rooms");
      expect(spySendStr.getCall(1).args[0]).to.have.
        string("Room Database Reloaded!");
      expect(stubLoadRoomDb.calledOnce).to.be.true;

      expect(stubLoadStoreDb.calledOnce).to.be.false;
      game.handle("reload stores");
      expect(spySendStr.getCall(2).args[0]).to.have.
        string("Store Database Reloaded!");
      expect(stubLoadStoreDb.calledOnce).to.be.true;

      game.handle("reload");
      expect(spySendStr.getCall(3).args[0]).to.have.
        string("Usage: reload <db>");

      game.handle("reload invalidDb");
      expect(spySendStr.getCall(4).args[0]).to.have.
        string("Invalid Database Name!");

      player.sendString.restore();
      itemDb.load.restore();
      roomDb.loadTemplates.restore();
      storeDb.load.restore();
    });

    it("should properly handle 'shutdown' command", () => {
      const spy = sinon.spy(Game, 'announce');
      const p = player;
      p.rank = PlayerRank.REGULAR;
      game.handle("shutdown");
      expect(spy.calledOnce).to.be.false;
      p.rank = PlayerRank.GOD;
      game.handle("shtudown");
      expect(spy.calledOnce).to.be.false;
      p.rank = PlayerRank.ADMIN;
      Game.setIsRunning(true);
      expect(Game.isRunning()).to.be.true;
      game.handle("shutdown");
      expect(spy.calledOnce).to.be.true;
      expect(spy.getCall(0).args[0]).to.
        equal("SYSTEM IS SHUTTING DOWN");
      expect(Game.isRunning()).to.be.false;
      Game.announce.restore();
    });

    // ------------------------------------------------------------------------
    //  Command not recognized, send to room
    // ------------------------------------------------------------------------

    it("should send command to room if not recognized", () => {
      const p = player;
      p.name = "Test";
      game.handle("this is a test");
      const expectedMsg =
        "<bold>Test says: <dim>this is a test</dim></bold>";
      expect(stubSendRoom.getCall(0).args[0]).to.equal(expectedMsg);
    });

  });

  it("should properly transition to enter()", () => {
    const p = player;
    const stubGoToTrain = sinon.stub(game, 'goToTrain').callsFake();
    const expectedMsg = cc('bold') + cc('green') +
      `${p.name} has entered the realm` +
      cc('reset') + cc('bold') + cc('reset');

    expect(p.active).to.be.false;
    expect(p.loggedIn).to.be.false;
    p.newbie = false;
    game.enter();
    expect(p.active).to.be.true;
    expect(p.loggedIn).to.be.true;
    expect(stubGoToTrain.calledOnce).to.be.false;
    p.newbie = true;
    game.enter();
    expect(stubGoToTrain.calledOnce).to.be.true;

    game.goToTrain.restore();
  });

  it("should properly trigger leave()", () => {
    const p = player;
    const stubLogout = sinon.stub(playerDb, 'logout').callsFake();
    const stubSaveData = sinon.stub(roomDb, 'saveData').callsFake();

    p.active = true;
    conn.isClosed = true;
    game.leave();
    expect(p.active).to.be.false;
    expect(stubLogout.calledOnce).to.be.true;
    expect(stubSaveData.calledOnce).to.be.true;
    conn.isClosed = false;

    playerDb.logout.restore();
    roomDb.saveData.restore();
  });

  it("should properly trigger hungup()", () => {
    const p = player;
    const stubLogoutMsg = sinon.stub(Game, 'logoutMessage').callsFake();
    const expectedMsg = p.name + " has suddenly disappeared from the realm.";
    game.hungup();
    expect(stubLogoutMsg.getCall(0).args[0]).to.equal(expectedMsg);
    Game.logoutMessage.restore();
  });

  it("should properly go to Train handler", () => {
    const stubAddHandler =
      sinon.stub(conn, "addHandler").callsFake();
    player.name = "TestUser201";
    player.connection = conn;
    player.loggedIn = true;
    player.active = true;

    const expectedText = cc('red') + cc('bold') +
      player.name + " leaves to edit stats" + cc('reset')+
      cc('red') + cc('reset') + cc('newline');

    game.goToTrain();
    expect(stubAddHandler.calledOnce).to.be.true;
    expect(stubSocketSend.getCall(0).args[0]).to.
      equal(expectedText);

    conn.addHandler.restore();
  });

  const testSendToPlayers = (sendCommand, filter) => {
    const originalDbSize = playerDb.size();
    const players = [];
    const stubs = [];
    for (let i = 0; i < 10; i++) {
      const player = new Player();
      players[i] = player;
      stubs[i] = sinon.stub(player, 'sendString').callsFake();
      if (i % 2 === 0) player[filter] = true;
      else player[filter] = false;
      playerDb.add(player);
    }
    Game[sendCommand]("testing 123");
    stubs.forEach((stub, i) => {
      if (i % 2 === 0) expect(stub.calledOnce).to.be.true;
      else expect(stub.calledOnce).to.be.false;
    });
    players.forEach((player) => {
      playerDb.map.delete(player.id);
      player.sendString.restore();
    });
    expect(playerDb.size()).to.equal(originalDbSize);
  };

  it("should properly send message to all logged in users", () => {
    testSendToPlayers('sendGlobal', 'loggedIn');
  });

  it("should properly send message to all active users", () => {
    testSendToPlayers('sendGame', 'active');
  });

  it("should properly send logout message to active players", () => {
    const stub = sinon.stub(Game, 'sendGame').callsFake();
    const expectedMsg = "<red><bold>Player X is dropped.</bold></red>";
    Game.logoutMessage("Player X is dropped.");
    expect(stub.getCall(0).args[0]).to.equal(expectedMsg);
    Game.sendGame.restore();
  });

  it("should properly send announcement to logged in players", () => {
    const stub = sinon.stub(Game, 'sendGlobal').callsFake();
    const expectedMsg = "<cyan><bold>Test announcement!</bold></cyan>";
    Game.announce("Test announcement!");
    expect(stub.getCall(0).args[0]).to.equal(expectedMsg);
    Game.sendGlobal.restore();
  });

  it("should properly send whispers", () => {
    const stub = stubSocketSend;
    const p = player;
    const recipient = new Player();
    const testMsg = "Test whisper...";
    let expectedMsg = cc('red') + cc('bold') +
      "Error, cannot find user" + cc('reset') +
      cc('red') + cc('reset') + cc('newline');
    p.name = "Bob";
    recipient.name = "Sue";
    recipient.connection = conn;
    game.whisper(testMsg, "Sue");
    expect(stub.getCall(0).args[0]).to.equal(expectedMsg);
    recipient.active = false;

    playerDb.add(recipient);
    game.whisper(testMsg, recipient.name);
    expect(stub.getCall(1).args[0]).to.equal(expectedMsg);

    recipient.active = true;
    game.whisper(testMsg, recipient.name);
      expectedMsg = cc('yellow') + p.name + " whispers to you: " +
        cc('reset') + testMsg + cc('newline');
    expect(stub.getCall(2).args[0]).to.equal(expectedMsg);

    playerDb.map.delete(recipient.id);
  });

  it ("should properly display who list", () => {
    const originalPlayerMap = playerDb.map;
    playerDb.map = new Map();
    expect(playerDb.size()).to.equal(0);
    const admin = new Player();
    admin.name = "TestAdmin";
    admin.rank = PlayerRank.ADMIN;
    admin.active = false;
    admin.loggedIn = true;
    admin.level = 100;
    playerDb.add(admin);
    const god = new Player();
    god.name = "TestGod";
    god.rank = PlayerRank.GOD;
    god.active = true;
    god.loggedIn = true;
    god.level = 505;
    playerDb.add(god);
    const user = new Player();
    user.name = "TestUser";
    user.rank = PlayerRank.REGULAR;
    user.active = false;
    user.loggedIn = false;
    user.level = 10;
    playerDb.add(user);
    expect(playerDb.size()).to.equal(3);
    const whoHeader = cc('white') + cc('bold') +
      "--------------------------------------------------------------------------------" + cc('newline') +
      " Name             | Level     | Activity | Rank\r\n" +
      "--------------------------------------------------------------------------------" + cc('newline');
    const whoFooter =
      "--------------------------------------------------------------------------------" +
      cc('reset') + cc('white') + cc('reset');

    let expectedText = whoHeader +
      " TestAdmin        | 100       | " +
      cc('yellow') + "Inactive" + cc('reset') + cc('bold') + cc('white') +
       " | " + cc('green') + "ADMIN" + cc('reset') + cc('bold') + cc('white') +
       cc('newline') +
      " TestGod          | 505       | " +
      cc('green') + "Online  " + cc('reset') + cc('bold') + cc('white') +
       " | " + cc('yellow') + "GOD" + cc('reset') + cc('bold') + cc('white') +
       cc('newline') +
      " TestUser         | 10        | " +
      cc('red') + "Offline " + cc('reset') + cc('bold') + cc('white') +
       " | " + cc('white') + "REGULAR" + cc('reset') + cc('bold') + cc('white') +
       cc('newline') + whoFooter;

    expect(telnet.translate(Game.whoList('all'))).to.equal(expectedText);

    admin.loggedIn = false;
    expectedText = whoHeader +
      " TestGod          | 505       | " +
      cc('green') + "Online  " + cc('reset') + cc('bold') + cc('white') +
       " | " + cc('yellow') + "GOD" + cc('reset') + cc('bold') + cc('white') +
       cc('newline') + whoFooter;

    expect(telnet.translate(Game.whoList())).to.equal(expectedText);

    playerDb.map = originalPlayerMap;
  });

  it ("should properly display help", () => {
    const help = cc('white') + cc('bold') +
        "--------------------------------- Command List ---------------------------------\r\n" +
        " /                          - Repeats your last command exactly.\r\n" +
        " chat <mesg>                - Sends message to everyone in the game\r\n" +
        " experience                 - Shows your experience statistics\r\n" +
        " help                       - Shows this menu\r\n" +
        " inventory                  - Shows a list of your items\r\n" +
        " quit                       - Allows you to leave the realm.\r\n" +
        " remove <'weapon'/'armor'>  - removes your weapon or armor\r\n" +
        " stats                      - Shows all of your statistics\r\n" +
        " time                       - shows the current system time.\r\n" +
        " use <item>                 - use an item in your inventory\r\n" +
        " whisper <who> <msg>        - Sends message to one person\r\n" +
        " who                        - Shows a list of everyone online\r\n" +
        " who all                    - Shows a list of everyone\r\n" +
        " look                       - Shows you the contents of a room\r\n" +
        " north/east/south/west      - Moves in a direction\r\n" +
        " get/drop <item>            - Picks up or drops an item on the ground\r\n" +
        " train                      - Train to the next level (TR)\r\n" +
        " editstats                  - Edit your statistics (TR)\r\n" +
        " list                       - Lists items in a store (ST)\r\n" +
        " buy/sell <item>            - Buy or Sell an item in a store (ST)\r\n" +
        " attack <enemy>             - Attack an enemy\r\n" +
        cc('reset') + cc('white') + cc('reset');

      const god = cc('yellow') + cc('bold') +
        "--------------------------------- God Commands ---------------------------------\r\n" +
        " kick <who>                 - kicks a user from the realm\r\n" +
        cc('reset') + cc('yellow') + cc('reset');

      const admin = cc('green') + cc('bold') +
        "-------------------------------- Admin Commands --------------------------------\r\n" +
        " announce <msg>             - Makes a global system announcement\r\n" +
        " changerank <who> <rank>    - Changes the rank of a player\r\n" +
        " reload <db>                - Reloads the requested database\r\n" +
        " shutdown                   - Shuts the server down\r\n" +
        cc('reset') + cc('green') + cc('reset');

      const end =
        "--------------------------------------------------------------------------------";

      expect(telnet.translate(Game.printHelp(PlayerRank.REGULAR))).to.
        equal(help + end);
      expect(telnet.translate(Game.printHelp(PlayerRank.GOD))).to.
        equal(help + god + end);
      expect(telnet.translate(Game.printHelp(PlayerRank.ADMIN))).to.
        equal(help + god + admin + end);
  });

  it("should properly print player's experience", () => {
    const p = game.player;
    p.level = 2;
    p.experience = 25;
    const expectedText = cc('white') + cc('bold') +
      " Level:         " + p.level + cc('newline') +
      " Experience:    " + p.experience + "/" +
      p.needForLevel(p.level + 1) + " (" +
      Math.round(100 * p.experience / p.needForLevel(p.level + 1)) +
      "%)" + cc('reset') + cc('white') + cc('reset');
    expect(telnet.translate(game.printExperience())).to.
      equal(expectedText)
  });

  it("should properly print player's stats", () => {
    const p = game.player;
    const attr = p.GetAttr.bind(p);
    p.level = 2;
    p.experience = 25;
    p.hitPoints = 5;
    Attribute.enums.forEach((item) => {
      p.baseAttributes[item] = Math.round(Math.random() * 10);
    });
    const experienceText = cc('white') + cc('bold') +
      " Level:         " + p.level + cc('newline') +
      " Experience:    " + p.experience + "/" +
      p.needForLevel(p.level + 1) + " (" +
      Math.round(100 * p.experience / p.needForLevel(p.level + 1)) +
      "%)" + cc('reset') + cc('white') + cc('bold') + cc('reset');

    const expectedText = cc('white') + cc('bold') +
    "---------------------------------- Your Stats ----------------------------------\r\n" +
    " Name:          " + p.name + cc('newline') +
    " Rank:          " + p.rank.toString() +  cc('newline') +
    " HP/Max:        " + p.hitPoints + "/" + attr(Attribute.MAXHITPOINTS) +
    "  (" + Math.round(100 * p.hitPoints / attr(Attribute.MAXHITPOINTS)) + "%)" +
    cc('newline') + experienceText + cc('bold') + cc('white') + cc('newline') +
    " Strength:      " + tostring(attr(Attribute.STRENGTH), 16) +
    " Accuracy:      " + tostring(attr(Attribute.ACCURACY)) + cc('newline') +
    " Health:        " + tostring(attr(Attribute.HEALTH), 16) +
    " Dodging:       " + tostring(attr(Attribute.DODGING)) + cc('newline') +
    " Agility:       " + tostring(attr(Attribute.AGILITY), 16) +
    " Strike Damage: " + tostring(attr(Attribute.STRIKEDAMAGE)) + cc('newline') +
    " StatPoints:    " + tostring(p.statPoints, 16) +
    " Damage Absorb: " + tostring(attr(Attribute.DAMAGEABSORB)) + cc('newline') +
    "--------------------------------------------------------------------------------" +
    cc('reset') + cc('white') + cc('reset');
    expect(telnet.translate(game.printStats())).to.
      equal(expectedText)
  });

  it("should properly print player's inventory", () => {
    const p = player;
    const weapon = itemDb.findByNameFull("Short Sword");
    const armor = itemDb.findByNameFull("Leather Armor");
    const potion = itemDb.findByNameFull("Healing Potion");
    p.pickUpItem(weapon);
    p.pickUpItem(armor);
    p.pickUpItem(potion);
    p.money = 123;
    expect(p.items).to.equal(3);

    let expectedText = cc('white') + cc('bold') +
      "-------------------------------- Your Inventory --------------------------------" +
      cc('newline') + " Items:  " + weapon.name + ", " +
      armor.name + ", " + potion.name + cc('newline') +
      " Weapon: NONE!" + cc('newline') + " Armor: NONE!" +
      cc('newline') + " Money:    $" + p.money + cc('newline') +
      "--------------------------------------------------------------------------------" +
      cc('reset') + cc('white') + cc('reset');

    expect(telnet.translate(game.printInventory())).to.
      equal(expectedText);

    p.useWeapon(0);
    p.useArmor(1);

    expectedText = cc('white') + cc('bold') +
    "-------------------------------- Your Inventory --------------------------------" +
    cc('newline') + " Items:  " + weapon.name + ", " +
    armor.name + ", " + potion.name + cc('newline') +
    " Weapon: " + weapon.name + cc('newline') +
    " Armor: " + armor.name + cc('newline') +
    " Money:    $" + p.money + cc('newline') +
    "--------------------------------------------------------------------------------" +
    cc('reset') + cc('white') + cc('reset');

    expect(telnet.translate(game.printInventory())).to.
    equal(expectedText);

  });

  it("should properly use item from player's inventory", () => {
    const spy = sinon.spy(game, 'useItem');
    const stubSendRoom = sinon.stub(Game, 'sendRoom').callsFake();
    const p = player;
    p.name = "Test";
    const weapon = itemDb.findByNameFull("Rusty Knife");
    const armor = itemDb.findByNameFull("Leather Armor");
    const potion = itemDb.findByNameFull("Small Healing Potion");

    const expectedMsg = cc('red') + cc('bold') +
      "Could not find that item!" + cc('reset') +
      cc('red') + cc('reset') + cc('newline');

    game.useItem('Invalid Item');
    expect(spy.returnValues[0]).to.be.false;
    expect(stubSocketSend.getCall(0).args[0]).to.equal(expectedMsg);

    p.pickUpItem(weapon);
    p.pickUpItem(armor);
    p.pickUpItem(potion);

    expect(p.weapon).to.equal(-1);
    game.useItem(weapon.name);
    expect(spy.returnValues[1]).to.be.true;
    expect(stubSendRoom.getCall(0).args[0]).to.
      equal("<green><bold>Test arms a Rusty Knife</bold></green>");
    expect(p.weapon).to.equal(0);

    expect(p.armor).to.equal(-1);
    game.useItem(armor.name);
    expect(spy.returnValues[2]).to.be.true;
    expect(stubSendRoom.getCall(1).args[0]).to.
      equal("<green><bold>Test puts on a Leather Armor</bold></green>");
    expect(p.armor).to.equal(1);

    p.hitPoints = 0;
    expect(p.getItemIndex(potion.name)).to.equal(2);
    game.useItem(potion.name);
    expect(spy.returnValues[3]).to.be.true;
    expect(p.hitPoints).to.be.within(potion.min, potion.max);
    expect(p.getItemIndex(potion.name)).to.equal(-1);

    game.useItem.restore();
  });

  it("should properly remove item from player", () => {
    const spy = sinon.spy(game, 'removeItem');
    const p = player;
    const weapon = itemDb.findByNameFull("Rusty Knife");
    const armor = itemDb.findByNameFull("Leather Armor");
    const expectedMsg = cc('red') + cc('bold') +
      "Could not Remove item!" + cc('reset') +
      cc('red') + cc('reset') + cc('newline');

    game.removeItem('invalid');
    expect(spy.returnValues[0]).to.be.false;
    expect(stubSocketSend.getCall(0).args[0]).to.equal(expectedMsg);

    game.removeItem('weapon');
    expect(spy.returnValues[1]).to.be.false;
    expect(stubSocketSend.getCall(1).args[0]).to.equal(expectedMsg);

    game.removeItem('armor');
    expect(spy.returnValues[2]).to.be.false;
    expect(stubSocketSend.getCall(2).args[0]).to.equal(expectedMsg);

    p.pickUpItem(weapon);
    game.useItem(weapon.name);
    expect(p.Weapon()).to.equal(weapon);
    game.removeItem('weapon');
    expect(spy.returnValues[3]).to.be.true;
    expect(p.Weapon()).to.equal(0);

    p.pickUpItem(armor);
    game.useItem(armor.name);
    expect(p.Armor()).to.equal(armor);
    game.removeItem('armor');
    expect(spy.returnValues[4]).to.be.true;
    expect(p.Armor()).to.equal(0);

    game.removeItem.restore();
    Game.sendRoom.restore();
  });

  it("should properly print room's info", () => {
    const room = roomDb.findByNameFull("Training Room")

    const expectedText = cc('newline') + cc('bold') + cc('white') +
      room.name + cc('reset') + cc('bold') + cc('reset') +
      cc('newline') + cc('bold') + cc('magenta') +
      room.description + cc('reset') + cc('bold') + cc('reset') +
      cc('newline') + cc('bold') + cc('green') +
      "exits: NORTH  " + cc('reset') + cc('bold') + cc('reset') +
      cc('newline');

    expect(telnet.translate(Game.printRoom(room))).to.
      equal(expectedText);

    room.money = 123;

    let extraText = cc('bold') + cc('yellow') +
      "You see: $123" + cc('reset') + cc('bold') +
      cc('reset') + cc('newline');

    expect(telnet.translate(Game.printRoom(room))).to.
      equal(expectedText + extraText);

    const weapon = itemDb.findByNameFull("Shortsword");
    const armor = itemDb.findByNameFull("Leather Armor");
    room.items = [weapon, armor];

    extraText = cc('bold') + cc('yellow') +
      "You see: $123, Shortsword, Leather Armor" +
      cc('reset') + cc('bold') +
      cc('reset') + cc('newline');

    expect(telnet.translate(Game.printRoom(room))).to.
      equal(expectedText + extraText);

    player.name = "Test Player";
    room.addPlayer(player);

    extraText += cc('bold') + cc('cyan') +
      "People: Test Player" +
      cc('reset') + cc('bold') +
      cc('reset') + cc('newline');

    expect(telnet.translate(Game.printRoom(room))).to.
      equal(expectedText + extraText);

    room.removePlayer(player);
    room.items = [];
    room.money = 0;

  });

  it("should properly send text to players in a room", () => {
    const room = roomDb.findByNameFull("Training Room");
    const testP1 = new Player();
    const testP2 = new Player();
    const stubP1SendString = sinon.stub(testP1, 'sendString').callsFake();
    const stubP2SendString = sinon.stub(testP2, 'sendString').callsFake();

    room.addPlayer(testP1);
    room.addPlayer(testP2);

    Game.sendRoom("Testing", room);

    expect(stubP1SendString.calledOnce).to.be.true;
    expect(stubP2SendString.calledOnce).to.be.true;

    room.removePlayer(testP1);
    room.removePlayer(testP2);

    testP1.sendString.restore();
    testP2.sendString.restore();
  });

  it("should properly move player to new rooms", () => {
    const trainingRoom = roomDb.findByNameFull("Training Room");
    const avenue = roomDb.findByNameFull("Avenue");

    const testP1 = player;
    testP1.name = "TP1";
    testP1.room = trainingRoom;
    const stubP1SendString = sinon.stub(testP1, 'sendString').callsFake();

    const testP2 = new Player();
    testP2.name = "TP2";
    testP2.room = trainingRoom;
    const stubP2SendString = sinon.stub(testP2, 'sendString').callsFake();

    const testP3 = new Player();
    testP3.name = "TP3";
    testP3.room = avenue;
    const stubP3SendString = sinon.stub(testP3, 'sendString').callsFake();

    trainingRoom.addPlayer(testP1);
    trainingRoom.addPlayer(testP2);
    avenue.addPlayer(testP3);

    game.move('INVALID DIRECTION');

    expect(stubP1SendString.getCall(0).args[0]).to.have.
      string("<red>Invalid direction!</red>");

    game.move(Direction.SOUTH);
    expect(stubP1SendString.getCall(1).args[0]).to.have.
      string("<red>TP1 bumps into the wall to the SOUTH!!!</red>");
    expect(stubP2SendString.getCall(0).args[0]).to.have.
      string("<red>TP1 bumps into the wall to the SOUTH!!!</red>");

    game.move(Direction.NORTH);
    expect(stubP1SendString.getCall(2).args[0]).to.have.
      string("<green>You walk NORTH.</green>");

    expect(stubP2SendString.getCall(1).args[0]).to.have.
      string("<green>TP1 leaves to the NORTH.</green>");

    expect(stubP3SendString.getCall(0).args[0]).to.have.
      string("<green>TP1 enters from the SOUTH.</green>");

    expect(stubP1SendString.getCall(3).args[0]).to.have.
      string("<cyan>People: TP3, TP1</cyan>");

    trainingRoom.removePlayer(testP2);
    avenue.removePlayer(testP1);
    avenue.removePlayer(testP3);

    testP1.sendString.restore();
    testP2.sendString.restore();
    testP3.sendString.restore();
  });

  it("should properly allow player to pick up money from rooms", () => {
    const room = roomDb.findByNameFull("Training Room");
    const p = player;
    p.name = "Test";
    p.room = room;

    const stubSendString = sinon.stub(p, 'sendString').callsFake();
    room.addPlayer(p);
    room.money = 150;

    game.getItem('$Invalid Amount');
    expect(stubSendString.getCall(0).args[0]).to.
    equal("<red><bold>You don't see that here!</bold></red>");

    game.getItem('$1000');
    expect(stubSendString.getCall(1).args[0]).to.
      equal("<red><bold>There isn't that much here!</bold></red>");

    game.getItem('$125');
    expect(stubSendString.getCall(2).args[0]).to.
      equal("<cyan><bold>Test picks up $125.</bold></cyan>");
    expect(p.money).to.equal(125);
    expect(room.money).to.equal(25);

    room.removePlayer(p);
    room.money = 0;

    p.sendString.restore();
  });

  it("should properly allow player to pick up items from rooms", () => {
    const room = roomDb.findByNameFull("Training Room");
    const sword = itemDb.findByNameFull("Shortsword");
    const p = player;
    p.name = "Test";
    p.room = room;

    const stubSendString = sinon.stub(p, 'sendString').callsFake();
    room.addPlayer(p);
    room.addItem(sword);

    game.getItem('Invalid Item');
    expect(stubSendString.getCall(0).args[0]).to.
      equal("<red><bold>You don't see that here!</bold></red>");

    p.items = 16;
    game.getItem('Shortsword');
    expect(stubSendString.getCall(1).args[0]).to.
      equal("<red><bold>You can't carry that much!</bold></red>");

    expect(p.room.items[0]).to.equal(sword);
    p.items = 0;
    game.getItem('Shortsword');
    expect(stubSendString.getCall(2).args[0]).to.
      equal("<cyan><bold>Test picks up Shortsword.</bold></cyan>");

    expect(p.inventory[0]).to.equal(sword);
    expect(p.room.items).to.be.empty;

    room.items = [];
    room.removePlayer(p);

    p.sendString.restore();
  });

  it("should properly allow player to drop money in rooms", () => {
    const room = roomDb.findByNameFull("Training Room");
    const p = player;
    p.name = "Test";
    p.room = room;
    p.money = 150;

    const stubSendString = sinon.stub(p, 'sendString').callsFake();
    room.addPlayer(p);
    room.money = 0;

    game.dropItem('$Invalid Amount');
    expect(stubSendString.getCall(0).args[0]).to.
    equal("<red><bold>You don't have that!</bold></red>");

    game.dropItem('$1000');
    expect(stubSendString.getCall(1).args[0]).to.
      equal("<red><bold>You don't have that much!</bold></red>");

    game.dropItem('$125');
    expect(stubSendString.getCall(2).args[0]).to.
      equal("<cyan><bold>Test drops $125.</bold></cyan>");
    expect(p.money).to.equal(25);
    expect(room.money).to.equal(125);

    room.removePlayer(p);
    room.money = 0;

    p.sendString.restore();
  });

  it("should properly allow player to drop items in rooms", () => {
    const room = roomDb.findByNameFull("Training Room");
    const sword = itemDb.findByNameFull("Shortsword");
    const p = player;
    p.name = "Test";
    p.room = room;
    p.pickUpItem(sword);

    const stubSendString = sinon.stub(p, 'sendString').callsFake();
    room.addPlayer(p);
    room.items = [];

    game.dropItem('Invalid Item');
    expect(stubSendString.getCall(0).args[0]).to.
      equal("<red><bold>You don't have that!</bold></red>");

    expect(p.inventory[0]).to.equal(sword);
    game.dropItem('Shortsword');
    expect(stubSendString.getCall(1).args[0]).to.
      equal("<cyan><bold>Test drops Shortsword.</bold></cyan>");

    expect(p.inventory[0]).to.equal(0);
    expect(p.room.items[0]).to.equal(sword);

    room.items = [];
    room.removePlayer(p);

    p.sendString.restore();
  });

  it("should properly prints out info of a store", () => {
    const store = new Store();
    const knife = itemDb.findByNameFull("Knife");
    const armor = itemDb.findByNameFull("Leather Armor");
    const potion = itemDb.findByNameFull("Minor Healing Potion");
    store.name = "Test Store";
    store.items = [knife, armor, potion];
    knife.price = 100;
    armor.price = 200;
    potion.price = 50;
    storeDb.add(store);
    const expectedText = cc('white') + cc('bold') +
        "--------------------------------------------------------------------------------\r\n" +
        " Welcome to " + store.name + "!\r\n" +
        "--------------------------------------------------------------------------------\r\n" +
        " Item                           | Price\r\n" +
        "--------------------------------------------------------------------------------\r\n" +
        " Knife                          | 100\r\n" +
        " Leather Armor                  | 200\r\n" +
        " Minor Healing Potion           | 50\r\n" +
        "--------------------------------------------------------------------------------\r\n" +
        cc('reset') + cc('white') + cc('reset');
    expect(Game.storeList('INVALID ID')).to.be.false;
    expect(telnet.translate(Game.storeList(store.id))).to.
      equal(expectedText);
    storeDb.map.delete(store.id);
  });

  it("should properly allow player to buy items from a store", () => {
    const p = player;
    p.name = "Test";
    p.room = new Room();

    expect(game.buy('Item from Invalid Store')).to.be.false;

    const room = roomDb.findByNameFull("Samuels Armorsmith");
    p.room = room;

    const stubSendString = sinon.stub(p, 'sendString').callsFake();
    room.addPlayer(p);
    room.money = 0;

    game.buy('Invalid Item');
    expect(stubSendString.getCall(0).args[0]).to.have.
      string("<red><bold>Sorry, we don't have that item!</bold></red>");

    game.buy('Chainmail Armor');
    expect(stubSendString.getCall(1).args[0]).to.have.
      string("<red><bold>Sorry, but you can't afford that!</bold></red>");

    p.money = 100;
    p.items = 16;

    game.buy('Chainmail Armor');
    expect(stubSendString.getCall(2).args[0]).to.have.
      string("<red><bold>Sorry, but you can't carry that much!</bold></red>");

    p.items = 0;
    game.buy('Chainmail Armor');
    expect(stubSendString.getCall(3).args[0]).to.have.
      string("<cyan><bold>Test buys a Chainmail Armor</bold></cyan>");

    expect(p.money).to.equal(20); // armor costs 80 in items.json:item 47

    p.sendString.restore();
  });

  it("should properly allow player to sell items to a store", () => {
    const p = player;
    p.name = "Test";
    p.room = new Room();

    expect(game.sell('Item from Invalid Store')).to.be.false;

    const room = roomDb.findByNameFull("The Insane Alchemist's Workshop");
    p.room = room;
    p.money = 0;

    const stubSendString = sinon.stub(p, 'sendString').callsFake();
    room.addPlayer(p);

    const sword = itemDb.findByNameFull("Shortsword");
    const potion = itemDb.findByNameFull("Minor Healing Potion")

    game.sell("Shortsword");
    expect(stubSendString.getCall(0).args[0]).to.have.
      string("<red><bold>Sorry, you don't have that!</bold></red>");

    p.pickUpItem(sword);
    game.sell("Shortsword");
    expect(stubSendString.getCall(1).args[0]).to.have.
      string("<red><bold>Sorry, we don't want that item!</bold></red>");

    p.sendString.restore();

  });
});
