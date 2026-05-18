#include <Wire.h>
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

int mq135Pin = A0;

float temperatura = 0;
int nivelGas = 0;
int calidadAire = 0;
int humo = 0;

char datos_esclavo1[32];

void setup() {
  Serial.begin(9600);

  Wire.begin(8);
  Wire.onRequest(enviarDatos);

  dht.begin();
}

unsigned long lastDHTRead = 0;

void loop() {
  // ===== Lecturas (DHT con proteccion de tiempo) =====
  if (millis() - lastDHTRead >= 1500) {
    lastDHTRead = millis();
    float t = dht.readTemperature();
    if (!isnan(t)) {
      temperatura = t;
    }
  }

  nivelGas = analogRead(mq135Pin);

  // ===== Calidad de aire (0-100%) =====
  calidadAire = map(nivelGas, 0, 1023, 0, 100);
  humo = (calidadAire >= 19) ? 1 : 0;

  // [PENDIENTE] Control de ventilador por PWM
  // Requiere: transistor 2N2222 + diodo 1N4007 + resistencia 220 ohm
  // #define FAN_PIN 5
  // pinMode(FAN_PIN, OUTPUT);
  // int velocidad = 0;
  // if (temperatura >= 35) velocidad = 255;
  // else if (temperatura >= 30) velocidad = 191;
  // else if (temperatura >= 25) velocidad = 128;
  // else velocidad = 0;
  // analogWrite(FAN_PIN, velocidad);

  // ===== Formato de salida =====
  snprintf(datos_esclavo1, sizeof(datos_esclavo1),
           "|%d,%d",
           humo,
           (int)temperatura);

  Serial.print("AQ:");
  Serial.print(calidadAire);
  Serial.print("% ");
  Serial.println(datos_esclavo1);

  delay(1000);
}

void enviarDatos() {
  Wire.write(datos_esclavo1);
}