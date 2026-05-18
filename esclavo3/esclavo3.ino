#include <Wire.h>
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

int fc28Pin = A0;
int bombaPin = 7;

float temperatura = 0;
float humedadAire = 0;
int humedadSuelo = 0;

char datos_esclavo3[32];

void setup() {
  Serial.begin(9600);

  Wire.begin(10);
  Wire.onRequest(enviarDatos);

  dht.begin();
  pinMode(bombaPin, OUTPUT);
  digitalWrite(bombaPin, LOW);
}

unsigned long lastDHTRead = 0;

void loop() {
  if (millis() - lastDHTRead >= 1500) {
    lastDHTRead = millis();
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t)) temperatura = t;
    if (!isnan(h)) humedadAire = h;
  }

  humedadSuelo = map(analogRead(fc28Pin), 0, 1023, 100, 0);

  snprintf(datos_esclavo3, sizeof(datos_esclavo3),
           "|%d,%d,%d",
           humedadSuelo,
           (int)temperatura,
           (int)humedadAire);

  Serial.println(datos_esclavo3);
  delay(1000);
}

void enviarDatos() {
  Wire.write(datos_esclavo3);
}
