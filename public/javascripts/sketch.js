const ues = [];
const gnbs = [];


function setup() {
  loadJSON("configs/test.json", (data) => {
    let config;
    config = data;
    window.config = config;
    createCanvas(config.width, config.height);

    for (let i = 0 ; i < config.ues.length ; i++) {
      const ue = config.ues[i];
      ues.push(new UE(20, ue.speed, ue.name, ue.power));
    }
    for (let i = 0 ; i < config.gnbs.length ; i++) {
      const gnb = config.gnbs[i];
      gnbs.push(new GNB(gnb.x, gnb.y, gnb.name, gnb.power));
      gnbs[i].setColor(getColour(i * (2 * PI / config.gnbs.length)));
    }

    // for (let i = 0 ; i < 1000 ; i++) {
    //   const ue = config.ues[i];
    //   ues.push(new UE(20, 1, "UE", 500));
    // }
    // gnbs.push(new GNB(40,  40,  "GNB", 1000));
    // gnbs.push(new GNB(40,  500, "GNB", 1000));
    // gnbs.push(new GNB(40,  960, "GNB", 1000));
    // gnbs.push(new GNB(500, 40,  "GNB", 1000));
    // gnbs.push(new GNB(500, 960, "GNB", 1000));
    // gnbs.push(new GNB(960, 40,  "GNB", 1000));
    // gnbs.push(new GNB(960, 500, "GNB", 1000));
    // gnbs.push(new GNB(960, 960, "GNB", 1000));
    // gnbs.forEach((gnb, i) => {
    //   gnb.setColor(getColour(i * (2 * PI / gnbs.length)));
    // });
  });
}

function draw() {
  background(200);
  gnbs.forEach(gnb => {
    gnb.draw();
  });
  ues.forEach(ue => {
    ue.move();
    ue.draw();
  });
}


class UE {
  
  constructor(size, speed, name, power) {
    const w = window.config.width;
    const h = window.config.height;
    this.xMax = w * 0.9;
    this.yMax = h * 0.9;
    this.xMin = w * 0.1;
    this.yMin = h * 0.1;
    this.heading = random(2 * PI);
    this.targetX = this.bimodalRandom(this.xMin, this.xMax);
    this.targetY = this.bimodalRandom(this.yMin, this.yMax);
    this.x = random(this.xMin, this.xMax);
    this.y = random(this.yMin, this.yMax);
    this.speed = speed;
    this.size = size;
    this.gnb = null;
    this.name = name;
    this.maxDistance = power;
    this.offset1 = random(360);
    this.offset2 = random(360);
    this.scale = 255 / power;
    this.maxRotationSpeed = speed / 10;
  }
  
  move() {
    this.rotateTowardsTarget();
    this.x = this.x + cos(this.heading) * this.speed;
    this.y = this.y + sin(this.heading) * this.speed;
    if (dist(this.x, this.y, this.targetX, this.targetY) < 20) {
        this.targetX = this.bimodalRandom(this.xMin, this.xMax);
        this.targetY = this.bimodalRandom(this.yMin, this.yMax);
    }
  }
  
  draw() {
    if (!this.gnb) {
      fill(255,0,0);
    }
    circle(this.x, this.y, this.size);
    // circle(this.targetX, this.targetY, 2);
    fill(255,255,255);
    if (this.gnb) {
      const d =  dist(this.gnb.x, this.gnb.y, this.x, this.y);
      length = 600 - d;
      stroke(50,50,50,150);
      line(this.gnb.x, this.gnb.y, this.x, this.y);
      stroke(0,0,0,255);
      fill("BLACK");
      const x = this.x;
      const y = this.y;
      triangle(
        x,             y, 
        x + length/20, y,
        x + length/20, y-length/30
      );
      fill("WHITE");
      if (d > this.maxDistance) {
        this.gnb.delUE();
        this.gnb = null;
      }
    }
    if (!this.gnb) {
      this.attachToClosestCell();
    }
  }
  
  attachToClosestCell() {
    let connections = 1000;
    let newGNB = this.gnb;
    const availableGNBs = [];

    for (let i = 0; i < gnbs.length; i++) {
      const gnb = gnbs[i];
      const distance = dist(this.x, this.y, gnb.x, gnb.y);
      if (distance < this.maxDistance) {
        availableGNBs.push(gnb);
      }
    }
    for (let i = 0; i < availableGNBs.length; i++) {
      const gnb = availableGNBs[i];
      if (gnb.ues < connections) {
        newGNB = gnb;
        connections = gnb.ues;
      }
      // const distance2 = dist(this.x, this.y, gnb.x, gnb.y);
      // if (distance2 < distance) {
      //   distance = distance2;
      //   newGNB = gnb;
      // }
    }
    this.attach(newGNB);
  }

  bimodalRandom(min, max) {
    const uShape = Math.random() * (Math.abs(max - min) / 2);
    return (Math.random() < 0.5) ? min + uShape : max - uShape;
  }
  
  attach(gnb) {
    if (!gnb) {
      this.gnb = null;
      return;
    }
    if (this.gnb == gnb) {
      return;
    }
    this.gnb = gnb;
    gnb.addUE();
    // console.log(`Send message to RIC: ${this.name} attached to ${gnb.name}`);
  }

  rotateTowardsTarget() {
    // Calculate angle between object's heading and direction towards the target
    let angleToTarget = Math.atan2(this.targetY - this.y, this.targetX - this.x) - this.heading;
    // Ensure angle is within range [-π, π]
    if (angleToTarget > PI) {
        angleToTarget -= 2 * PI;
    } else if (angleToTarget < -PI) {
        angleToTarget += 2 * PI;
    }
    // Determine rotation direction (clockwise or counterclockwise)
    const rotationDirection = (angleToTarget > 0) ? 1 : -1;
    // Calculate the maximum rotation angle
    const rotationAngle = min(abs(angleToTarget), this.maxRotationSpeed);
    // Update heading
    this.heading += rotationDirection * rotationAngle;
}
  
}


class GNB {
  
  constructor(x, y, name, power) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.name = name;
    this.power = power;
    this.color = "GRAY";
    this.ues = 0;
  }

  addUE() {
    this.ues++;
  }

  delUE() {
    this.ues--;
  }

  setColor(col) {
    this.color = color(col);
  }
  
  draw() {
    const x = this.x;
    const y = this.y;
    const s = this.size;
    const p = this.power;
    noFill();
    stroke(this.color);
    circle(x, y, p);
    stroke("BLACK");
    fill(this.color);
    triangle(x, y-s, x-s, y+s, x+s, y+s);
    fill("WHITE");
  }
}

function loadJSON(path, success) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        success(JSON.parse(xhr.responseText));
      }
    }
  };
  xhr.open("GET", path, true);
  xhr.send();
}

function getColour(h) {
  var s = 1;
  var v = 1;
  var hue = 0;
  var p, q, t, ff, r, g, b, i;
  if (s <= 0.0) {       // < is bogus, just shuts up warnings
    r = v;
    g = v;
    b = v;
    return "rgb(" + Math.floor(r * 255) + "," + Math.floor(g * 255) + "," + Math.floor(b * 255) + ")";
  }
  h = ((h * (180 / Math.PI) + hue) % 360) / 60;
  i = Math.floor(h);
  ff = h - i;
  p = v * (1.0 -  s);
  q = v * (1.0 - (s * ff));
  t = v * (1.0 - (s * (1.0 - ff)));
  switch(i) {
    case 0 : r = v; g = t; b = p; break;
    case 1 : r = q; g = v; b = p; break;
    case 2 : r = p; g = v; b = t; break;
    case 3 : r = p; g = q; b = v; break;
    case 4 : r = t; g = p; b = v; break;
    default: r = v; g = p; b = q; break;
  }
  return "rgb(" + Math.floor(r * 255) + "," + Math.floor(g * 255) + "," + Math.floor(b * 255) + ")";
}