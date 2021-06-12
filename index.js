const canvas = document.querySelector('#main-canvas');
const c = canvas.getContext('2d');
canvas.height = innerHeight;
canvas.width = innerWidth;

const startGameBtn = document.getElementById('start-game-btn');
const scoreEl = document.getElementById('scoreEl');
const modalEl = document.getElementById('modal');
const gameOverScore = document.getElementById('game-over-score');


let animationId;
let score;
let enemyInterval;

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }
    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
    }
}



class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x += this.velocity.x
        this.y += this.velocity.y
    }
}



class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x += this.velocity.x
        this.y += this.velocity.y
    }
}

const friction = 0.99;
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
    }
}

const x = innerWidth/2;
const y = innerHeight/2;
const player = new Player(x, y, 10, 'white');

let projectiles, enemies, particles;

function init() {
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreEl.innerHTML = 0;
    gameOverScore.innerHTML = 0;
}


function spawnEnemies() {
    enemyInterval = setInterval(function(){

        let radius = Math.random() * (30 - 6) + 6;
        let x, y;

        if(Math.random() < 0.5 ) {
            x = Math.random() < 0.5 ?  0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ?  0 - radius : canvas.height + radius;
        }
        
        let color = `hsl(${Math.random() * 360}, 50%, 50%)`;

        const angle = Math.atan2(
            canvas.height/2 - y, 
            canvas.width/2 - x
        );
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }

        enemies.push(new Enemy(x, y, radius, color, velocity));

    }, 1000);
}


function animate() {
    animationId = requestAnimationFrame(animate);

    // c.clearRect(0, 0, canvas.width, canvas.height);
    // c.fillStyle = 'black';

    c.fillStyle = 'rgba(0, 0, 0, 0.1)';// rgba provides fade effect on travelling projectiles and enemies
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();

    particles.forEach((particle, index)=> {
        if(particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    projectiles.forEach((projectile, index) => {
        projectile.update();

        //Remove projectiles if goes beyond edges of screen
        if(
            projectile.x - projectile.radius < 0 ||
            projectile.y - projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y - projectile.radius > canvas.height 
            ) {
            projectiles.splice(index, 1);
        }
    })

    enemies.forEach((enemy, index) => {
        enemy.update();

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)

        // Game Over
        if(dist - enemy.radius - player.radius < 0.5) {
            cancelAnimationFrame(animationId);
            clearInterval(enemyInterval);
            gameOverScore.innerHTML = score;
            modalEl.style.display = '';
        }
    
        //Collision Detection

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)
            
            if(dist - enemy.radius - projectile.radius < 1) {

                //Create particle explosion
                for (let index = 0; index < enemy.radius * 2; index++) { // BigerEnemy = moreParticles 
                    particles.push(new Particle(
                        projectile.x, 
                        projectile.y,
                        Math.random() * 2, 
                        enemy.color,
                        {
                            x: (Math.random() - 0.5) * (Math.random() * 6),
                            y: (Math.random() - 0.5) * (Math.random() * 6)
                        }
                    ));
                }
                if(enemy.radius > 15 ) {
                    //Increase Our Score
                    score += 100; // if reduce size of enemy give less score
                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    });

                    setTimeout(function(){
                        projectiles.splice(projectileIndex, 1); // Remove projectile on collision with enemy
                    }, 0)
                } else {
                    score += 250; // If enemy is removed from scene give more score
                    setTimeout(function(){
                        enemies.splice(index, 1); //Remove enemy on collision with projectile of radius less than or equal to 15
                        projectiles.splice(projectileIndex, 1); // Remove projectile on collision with enemy
                    }, 0)
                }
                scoreEl.innerHTML = score;
            }
        })
    })
}




addEventListener('click', function(event) {
    const angle = Math.atan2(
        event.clientY - canvas.height/2, 
        event.clientX - canvas.width/2
    );
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5 // increase projectile velocity by 5
    }
    let projectile = new Projectile(
        canvas.width/2, 
        canvas.height/2, 
        5, 
        'white', 
        velocity
    );
    projectiles.push(projectile)

});

startGameBtn.addEventListener('click', function() {
    init();
    modalEl.style.display = 'none';
    spawnEnemies();
    animate(); 
}); 
