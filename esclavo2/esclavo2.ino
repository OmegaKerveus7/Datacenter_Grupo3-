#include <Wire.h>
#include <Servo.h>

Servo servo1;
Servo servo2;

const int boton1 = 2;
const int boton2 = 3;
const int pirPin = 4;

int btn1 = 0;
int btn2 = 0;
int pir = 0;

char datos_esclavo2[20];

void setup() {
  servo1.attach(9);
  servo2.attach(10);

  pinMode(boton1, INPUT_PULLUP);
  pinMode(boton2, INPUT_PULLUP);
  pinMode(pirPin, INPUT);

  servo1.write(90);
  servo2.write(90);

  Wire.begin(9);
  Wire.onRequest(enviarDatos);
  Wire.onReceive(recibirComando);

  Serial.begin(9600);
  Serial.println("Esclavo2 I2C iniciado (addr 9)");
}

void loop() {
  btn1 = (digitalRead(boton1) == LOW) ? 1 : 0;
  btn2 = (digitalRead(boton2) == LOW) ? 1 : 0;
  pir = digitalRead(pirPin);

  if (btn1) servo1.write(180);
  else servo1.write(90);

  if (btn2) servo2.write(180);
  else servo2.write(90);

  snprintf(datos_esclavo2, sizeof(datos_esclavo2),
           "|%d,%d,%d", btn1, btn2, pir);

  Serial.println(datos_esclavo2);
  delay(100);
}

void enviarDatos() {
  Wire.write(datos_esclavo2);
}

void recibirComando(int bytes) {
  if (Wire.available()) {
    char cmd = Wire.read();
    if (cmd == 'O') {
      int puerta = Wire.read() - '0';
      if (puerta == 1) { servo1.write(180); Serial.println("Abrir puerta 1"); }
      if (puerta == 2) { servo2.write(180); Serial.println("Abrir puerta 2"); }
    } else if (cmd == 'C') {
      int puerta = Wire.read() - '0';
      if (puerta == 1) { servo1.write(90); Serial.println("Cerrar puerta 1"); }
      if (puerta == 2) { servo2.write(90); Serial.println("Cerrar puerta 2"); }
    }
  }
}
