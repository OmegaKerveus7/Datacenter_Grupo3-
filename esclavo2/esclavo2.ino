#include <Servo.h>

Servo servo1;
Servo servo2;

const int boton1 = 2;
const int boton2 = 3;

void setup() {

  servo1.attach(9);
  servo2.attach(10);

  pinMode(boton1, INPUT_PULLUP);
  pinMode(boton2, INPUT_PULLUP);

  // Posición inicial
  servo1.write(90);
  servo2.write(90);

  Serial.begin(9600);
}

void loop() {

  // SERVO 1
  if (digitalRead(boton1) == LOW) {
    // Botón presionado
    servo1.write(180);
  } else {
    // Botón suelto
    servo1.write(90);
  }

  // SERVO 2
  if (digitalRead(boton2) == LOW) {
    // Botón presionado
    servo2.write(180);
  } else {
    // Botón suelto
    servo2.write(90);
  }

  delay(20);
}