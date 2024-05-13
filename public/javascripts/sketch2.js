const ues = [];
const gnbs = [];
const socket = new WebSocket('ws://192.168.122.19:8765');

// WebSocket event listeners
socket.onopen = function(event) {
  console.log('WebSocket connected');
};

socket.onmessage = function(event) {
  console.log('Message from server:', event.data);
};

socket.onclose = function(event) {
  console.log('WebSocket closed');
};

socket.onerror = function(error) {
  console.error('WebSocket error:', error);
};

function setup() {
  loadJSON("configs/test.json", (data) => {
    let config;
    config = data;
    window.config = config;
    createCanvas(config.width, config.height);

    for (let i = 0 ; i < config.ues.length ; i++) {
      const ue = config.ues[i];
      ues.push(new UE(20, ue.speed, ue.name, ue.power, ue.id));
    }
    for (let i = 0 ; i < config.gnbs.length ; i++) {
      const gnb = config.gnbs[i];
      gnbs.push(new GNB(gnb.x, gnb.y, gnb.name, gnb.power, gnb.id));
      gnbs[i].setColor(getColour(i * (2 * PI / config.gnbs.length)));
    }
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


class gauge {

  constructor(x, y, title) {
    this.x = x;
    this.y = y;
    this.title = title;
  }

  updateValue(value) {
    this.value = value;
    fill('#D6DBDF');
    arc(this.x, this.y, 200, 200, 5 * QUARTER_PI, -QUARTER_PI);
    fill('#17202A');
    arc(this.x, this.y, 200, 200, 5 * QUARTER_PI, -QUARTER_PI - (HALF_PI - HALF_PI * this.value / 100));
    fill('#5D6D7E');
    arc(this.x, this.y, 180, 180, -PI, 0);
    textAlign(CENTER);
    textSize(15);
    fill('#17202A');
    text(this.value + '%', this.x, this.y - 20);
    textSize(25);
    text(this.title, this.x, this.y + 10);
    fill('#C0392B');
    let angle = -QUARTER_PI + (HALF_PI * this.value / 100);
    let x = this.x + 90 * sin(angle);
    let y = this.y - 90 * cos(angle);
    let y1 = this.y - 60 * cos(angle) + 5 * sin(angle);
    let x1 = this.x + 60 * sin(angle) + 5 * cos(angle);
    let y2 = this.y - 60 * cos(angle) - 5 * sin(angle);
    let x2 = this.x + 60 * sin(angle) - 5 * cos(angle);
    triangle(x, y, x1, y1, x2, y2);
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