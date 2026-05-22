#include <Wire.h>
#include <Servo.h>
#include <DHT.h>

Servo servo1;
Servo servo2;

const int boton1 = 2;
const int boton2 = 3;
const int pirPin = 4;
const int dhtPin = 7;

#define DHTTYPE DHT11
DHT dht(dhtPin, DHTTYPE);

int btn1Actual = 0;
int btn2Actual = 0;
int pir = 0;
int temperatura = 0;

int btn1Ant = HIGH;
int btn2Ant = HIGH;
unsigned long pirOnTime = 0;
bool pirActivo = false;
unsigned long ultimoDHT = 0;

const int POS_P1_CERRADA = 0;
const int POS_P1_ABIERTA = 95;
const int POS_P2_CERRADA = 90;
const int POS_P2_ABIERTA = 0;
const int TIEMPO_ABIERTA = 5000;

bool puerta1Abierta = false;
bool puerta2Abierta = false;
unsigned long tiempoPuerta1 = 0;
unsigned long tiempoPuerta2 = 0;

bool locked = false;

char datos_esclavo2[25];

void abrirPuerta1() {
  if (locked) {
    Serial.println("Puerta 1 bloqueada!");
    return;
  }
  servo1.write(POS_P1_ABIERTA);
  puerta1Abierta = true;
  tiempoPuerta1 = millis();
  Serial.println("Abrir puerta 1 (5s)");
}

void cerrarPuerta1() {
  servo1.write(POS_P1_CERRADA);
  puerta1Abierta = false;
  Serial.println("Cerrar puerta 1");
}

void abrirPuerta2() {
  if (locked) {
    Serial.println("Puerta 2 bloqueada!");
    return;
  }
  servo2.write(POS_P2_ABIERTA);
  puerta2Abierta = true;
  tiempoPuerta2 = millis();
  Serial.println("Abrir puerta 2 (5s)");
}

void cerrarPuerta2() {
  servo2.write(POS_P2_CERRADA);
  puerta2Abierta = false;
  Serial.println("Cerrar puerta 2");
}

void setup() {
  servo1.attach(9);
  servo2.attach(10);

  pinMode(boton1, INPUT_PULLUP);
  pinMode(boton2, INPUT_PULLUP);
  pinMode(pirPin, INPUT);
  dht.begin();

  cerrarPuerta1();
  cerrarPuerta2();

  Wire.begin(9);
  Wire.onRequest(enviarDatos);
  Wire.onReceive(recibirComando);

  Serial.begin(9600);
  Serial.println("Esclavo2 I2C iniciado (addr 9)");
}

void loop() {
  btn1Actual = digitalRead(boton1);
  btn2Actual = digitalRead(boton2);
  int pirLectura = digitalRead(pirPin);

  // DHT11 cada 2 segundos
  if (millis() - ultimoDHT >= 2000) {
    ultimoDHT = millis();
    float t = dht.readTemperature();
    if (!isnan(t)) temperatura = (int)t;
  }

  // PIR: debounce 200ms, pulso 1s, pausa 6s
  if (pirLectura == HIGH && !pirActivo) {
    if (millis() - pirOnTime > 200) {
      pirActivo = true;
      pirOnTime = millis();
      Serial.println("PIR: Movimiento detectado");
    }
  } else if (pirLectura == LOW && !pirActivo) {
    pirOnTime = millis();
  }

  if (pirActivo && millis() - pirOnTime < 1000) {
    pir = 1;
  } else {
    pir = 0;
    if (pirActivo && millis() - pirOnTime > 6000) { pirActivo = false; pirOnTime = millis(); }
  }

  if (btn1Actual == LOW && btn1Ant == HIGH) abrirPuerta1();
  btn1Ant = btn1Actual;

  if (btn2Actual == LOW && btn2Ant == HIGH) abrirPuerta2();
  btn2Ant = btn2Actual;

  if (puerta1Abierta && millis() - tiempoPuerta1 >= TIEMPO_ABIERTA) cerrarPuerta1();
  if (puerta2Abierta && millis() - tiempoPuerta2 >= TIEMPO_ABIERTA) cerrarPuerta2();

  snprintf(datos_esclavo2, sizeof(datos_esclavo2),
           "|%d,%d,%d,%d,%d,%d",
           btn1Actual == LOW ? 1 : 0,
           btn2Actual == LOW ? 1 : 0,
           pir,
           temperatura,
           puerta1Abierta ? 1 : 0,
           puerta2Abierta ? 1 : 0);

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
      if (puerta == 1) abrirPuerta1();
      if (puerta == 2) abrirPuerta2();
    } else if (cmd == 'C') {
      int puerta = Wire.read() - '0';
      if (puerta == 1) cerrarPuerta1();
      if (puerta == 2) cerrarPuerta2();
    } else if (cmd == 'L') {
      locked = true;
      Serial.println("Puertas BLOQUEADAS");
    } else if (cmd == 'U') {
      locked = false;
      Serial.println("Puertas DESBLOQUEADAS");
    }
  }
}
