#include <Wire.h>
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

int mq135Pin = A0;

float temperatura = 0;
int nivelGas = 0;
int humo = 0;   // 0 o 1

char datos_esclavo1[32];

void setup() {
  Serial.begin(9600);

  Wire.begin(8);
  Wire.onRequest(enviarDatos);

  dht.begin();
}

void loop() {
  // ===== Lecturas =====
  nivelGas = analogRead(mq135Pin);
  temperatura = dht.readTemperature();

  // ===== Lógica de humo =====
  if (nivelGas > 86) {
    humo = 1;
  } else {
    humo = 0;
  }

  // ===== Formato de salida =====
  snprintf(datos_esclavo1, sizeof(datos_esclavo1),
           "|%d,%d",
           humo,
           (int)temperatura);

  Serial.println(datos_esclavo1);

  delay(1000);
}

void enviarDatos() {
  Wire.write(datos_esclavo1);
}