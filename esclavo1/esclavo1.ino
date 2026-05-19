#include <Wire.h>
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

int mq135Pin = A0;

float temperatura = 0;
float humedadAire = 0;
int nivelGas = 0;
int calidadAire = 0;
int humo = 0;
int lineaBase = 0;
int muestrasRecolectadas = 0;
const int DELTA = 3;

char datos_esclavo1[32];

void setup() {
  Serial.begin(9600);

  Wire.begin(8);
  Wire.onRequest(enviarDatos);

  dht.begin();
}

unsigned long lastDHTRead = 0;

void loop() {
  if (millis() - lastDHTRead >= 2000) {
    lastDHTRead = millis();
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t)) temperatura = t;
    if (!isnan(h)) humedadAire = h;
  }

  nivelGas = analogRead(mq135Pin);
  calidadAire = map(nivelGas, 0, 1023, 0, 100);

  if (muestrasRecolectadas < 30) {
    lineaBase = (lineaBase * muestrasRecolectadas + calidadAire) / (muestrasRecolectadas + 1);
    muestrasRecolectadas++;
    humo = 0;
  } else {
    if (calidadAire > lineaBase + DELTA) {
      humo = 1;
    } else {
      humo = 0;
      lineaBase = (lineaBase * 19 + calidadAire) / 20;
    }
  }

  snprintf(datos_esclavo1, sizeof(datos_esclavo1),
           "|%d,%d,%d",
           humo,
           (int)temperatura,
           (int)humedadAire);

  Serial.print("MQ135 raw=");
  Serial.print(nivelGas);
  Serial.print(" calidad=");
  Serial.print(calidadAire);
  Serial.print("% temp=");
  Serial.print((int)temperatura);
  Serial.print(" hum=");
  Serial.print((int)humedadAire);
  Serial.print("% humo=");
  Serial.print(humo);
  Serial.print(" base=");
  Serial.println(lineaBase);

  delay(1000);
}

void enviarDatos() {
  Wire.write(datos_esclavo1);
}
