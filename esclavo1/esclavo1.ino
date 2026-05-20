#include <Wire.h>
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT11
#define FAN_PIN 6

DHT dht(DHTPIN, DHTTYPE);

int mq135Pin = A0;

float temperatura = 0;
float humedadAire = 0;
int nivelGas = 0;
int calidadAire = 0;
int humo = 0;
int lineaBase = 0;
int muestrasRecolectadas = 0;
const int DELTA = 5;

int fanSpeed = 0;
int fanLevel = 0;
const int FAN_OFF = 0;
const int FAN_LOW = 51;
const int FAN_MED = 102;
const int FAN_HIGH = 153;
const int T_LOW = 20;
const int T_MED = 25;
const int T_HIGH = 30;

char datos_esclavo1[32];

void setup() {
  Serial.begin(9600);

  Wire.begin(8);
  Wire.onRequest(enviarDatos);

  dht.begin();

  pinMode(FAN_PIN, OUTPUT);
  analogWrite(FAN_PIN, 0);
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

  int nuevoPWM = FAN_OFF;
  fanLevel = 0;
  if (temperatura >= T_HIGH) {
    nuevoPWM = FAN_HIGH; fanLevel = 3;
  } else if (temperatura >= T_MED) {
    nuevoPWM = FAN_MED; fanLevel = 2;
  } else if (temperatura >= T_LOW) {
    nuevoPWM = FAN_LOW; fanLevel = 1;
  }
  if (nuevoPWM != fanSpeed) {
    fanSpeed = nuevoPWM;
    analogWrite(FAN_PIN, fanSpeed);
    Serial.print("Ventilador vel="); Serial.print(fanLevel);
    Serial.print(" PWM="); Serial.println(fanSpeed);
  }

  snprintf(datos_esclavo1, sizeof(datos_esclavo1),
           "|%d,%d,%d,%d",
           humo,
           (int)temperatura,
           (int)humedadAire,
           fanLevel);

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
  Serial.print(lineaBase);
  Serial.print(" fanPWM=");
  Serial.println(fanSpeed);

  delay(1000);
}

void enviarDatos() {
  Wire.write(datos_esclavo1);
}
