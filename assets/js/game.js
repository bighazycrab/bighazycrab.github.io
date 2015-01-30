(function(global) {
  var ZG = {
    gameWidth: global.innerWidth,
    gameHeight: global.innerHeight,
    scoring: {}
  };
  // new Game Instance       Width         Height         Renderer     game El ID              State manager
  var game = new Phaser.Game(ZG.gameWidth, ZG.gameHeight, Phaser.AUTO, 'game' , {preload: preload, create: create, update: update});

  // happens before the game starts
  function preload() {

    game.stage.backgroundColor = "#7EC0EE"

    // asset loader.  name of asset  -  location    -    width, height of sprite.
    game.load.image('ground', 'assets/img/platform.png');
    game.load.image('diamond', 'assets/img/diamond.png');
    // when loading a spritesheet, Phaser will automatically cut up the image into however many
    // frames it can based on the wdith and height you pass in initially.
    // These frames are later accessible in a 0-based index array
    game.load.spritesheet('dude', 'assets/img/dude.png', 32, 42);
    game.load.spritesheet('baddie', 'assets/img/baddie.png', 32, 32);

  }
  // the start of your game
  function create() {
    // Register what physics system we want to use (arcade is simplest)
    game.physics.startSystem(Phaser.Physics.Arcade);

    // allows you to do things to groups of objects
    var platforms = ZG.platforms = game.add.group();
    var diamonds = ZG.diamonds = game.add.group();
    var enemies = ZG.enemies = game.add.group();

    // Enables physics on the group
    platforms.enableBody = true;
    diamonds.enableBody = true;
    enemies.enableBody = true;

    //make a platform 40px down from the top.
    makePlatform(45);
    // every 1.5 seconds, make another platform at the top
    game.time.events.loop(1500, makePlatform);

    // place sprite on gameworld. remember how we added groups above.
    //                                       x, y, name   , frame
    var dude = ZG.dude = game.add.sprite(0,0, 'dude', 4);

    // animation for specific object
    //                    name,    frame loop, fps, loop?
    dude.animations.add('right', [5,6,7,8], 4, true);
    dude.animations.add('left', [0,1,2,3], 4, true);

    // enable physics on dude
    game.physics.arcade.enable(dude);
    dude.body.gravity.y = 1300;

    dude.events.onKilled.add(function(){
      game.state.restart()
    });

    // let's keep track of
    ZG.scoring.score = 0;
    ZG.scoring.HighScore = ZG.scoring.HighScore || 0
    //                                   x, y,   text     , options
    ZG.scoring.scoreText = game.add.text(16,16, 'Score: 0   High Score: '+ ZG.scoring.HighScore, {fontSize: '32px', fill: '#000'});

    // we could also use keyboard.addKey(Phaser.Keyboard.KEY)
    ZG.cursors = game.input.keyboard.createCursorKeys();
  }

  // runs every tick
  function update() {
    var dude = ZG.dude;
    var enemies = ZG.enemies;
    var platforms = ZG.platforms

    // won't let these objects pass through each other
    game.physics.arcade.collide(dude, platforms);
    game.physics.arcade.collide(enemies, platforms);

    // Runs a callback when two objects (either single, or groups of objects) overlap
    game.physics.arcade.overlap(dude, ZG.diamonds, function(dude, diamond) {
      diamond.kill();
      ZG.scoring.score++;

      if (ZG.scoring.score > ZG.scoring.HighScore) {
        ZG.scoring.HighScore = ZG.scoring.score
      }

      ZG.scoring.scoreText.text = 'Score: '+ZG.scoring.score+ '   High Score: '+ZG.scoring.HighScore;
    });

    game.physics.arcade.overlap(dude, enemies, function(dude, enemy) {
      dude.kill();
    });

    var cursors = ZG.cursors
    //  Reset the dudes velocity (movement)
    dude.body.velocity.x = 0;

    // if we fall, we die
    if (dude.y > ZG.gameHeight) {
      dude.kill()
    }

    //  Move to the left if not at the far left
    if (cursors.left.isDown && dude.x > 0) {
        dude.body.velocity.x = -400;
        dude.animations.play('left');

    //  Move to the right if not a far right
    } else if (cursors.right.isDown && dude.x < ZG.gameWidth - dude.width) {
        dude.body.velocity.x = 400;
        dude.animations.play('right');

    //  Stand still
    } else {
        dude.animations.stop();
        dude.frame = 4;
    }
    //  Allow the dude to jump if they are touching the ground.
    if (cursors.up.isDown && dude.body.touching.down) {
        dude.body.velocity.y = -700;
    }

    // for each member of group still in the game
    enemies.forEachExists(function(enemy){
      // if below game, remove them
      if (enemy.y > ZG.gameHeight) {
        enemy.kill();
        return;
      }
      // let's bounce
      if (enemy.body.touching.down) {
        enemy.body.velocity.y = -100;
      }

      // go back and forth
      if (enemy.x > ZG.gameWidth - 32 ) {
        enemy.body.velocity.x = -100;
        enemy.play('left')
      } else if (enemy.x < 1) {
        enemy.body.velocity.x = 100;
        enemy.play('right')
      }
    });
  }

  function makePlatform(height) {
    height = height || 0;
    holeSize = 128;
    velocity = 100;

    platforms = ZG.platforms;
    diamonds = ZG.diamonds;
    enemies = ZG.enemies;

    // Random placement of hole between the two sides
    placeHoleAt = Math.floor(Math.random() * (ZG.gameWidth - holeSize + 1));

    // group.create places an new member of the group on the world
    //                                 x,   y    , name (registered on preload)
    var leftPlatform = platforms.create(0, height, 'ground');
    var rightPlatform = platforms.create(placeHoleAt + holeSize, height, 'ground');
    var diamond = diamonds.create(placeHoleAt + holeSize / 2 - 16, height, 'diamond');

    // stretches image to the right.
    rightPlatform.width = ZG.gameWidth - placeHoleAt + holeSize
    leftPlatform.width = placeHoleAt;

    // won't be pushed when impacted by another body
    leftPlatform.body.immovable = true;
    rightPlatform.body.immovable = true;

    // be mindful of the world
    leftPlatform.checkWorldBounds = true;
    rightPlatform.checkWorldBounds = true;
    diamond.checkWorldBounds = true;

    // remove from game if out of world
    leftPlatform.outOfBoundsKill = true;
    rightPlatform.outOfBoundsKill = true;
    diamond.outOfBoundsKill = true;

    // move down at a constant rate
    leftPlatform.body.velocity.y = velocity;
    rightPlatform.body.velocity.y = velocity;
    diamond.body.velocity.y = velocity;

    if (!height) {
      // add enemy at a random place on the platform
      var baddie = enemies.create(Math.floor(Math.random() * (ZG.gameWidth - 32)), -30, 'baddie');

      // give him some animations
      baddie.animations.add('right', [2,3], 4, true);
      baddie.animations.add('left', [0,1], 4, true);

      // enable physics on our main man
      game.physics.arcade.enable(baddie);

      // randomly go left or right initially
      direction = Math.round(Math.random())? -100 : 100;
      baddie.body.velocity.x = direction;
      if (direction > 0) {
        baddie.play('right');
      } else {
        baddie.play('left');
      }

      // let's give this bad boy some gravity
      baddie.body.gravity.y = 800;
    }
  }

})(this)
