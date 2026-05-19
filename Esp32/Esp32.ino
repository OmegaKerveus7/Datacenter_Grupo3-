#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "Omega";
const char* password = "d5adc4a32689";
const char* serverSrv = "http://192.168.1.49:3000/area/servidores";
const char* serverJar = "http://192.168.1.49:3000/area/jardin";

#define RX2_PIN 16
#define TX2_PIN 17

// Ultimos valores area servidores
int ultSrvHumo = -1, ultSrvTemp = -1, ultSrvAlerta = -1;
// Ultimos valores area jardin
int ultJarSuelo = -1, ultJarTemp = -1, ultJarAire = -1;

String getValue(String data, char sep, int idx) {
  int encontrados = 0, inicio = 0;
  for (int i = 0; i <= data.length(); i++) {
    if (i == data.length() || data[i] == sep) {
      if (encontrados == idx) return data.substring(inicio, i);
      encontrados++;
      inicio = i + 1;
    }
  }
  return "";
}

void enviarPost(const char* url, const String& json) {
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int codigo = http.POST(json);
  Serial.print("  -> ");
  Serial.print(url);
  Serial.print(" ");
  if (codigo == 200 || codigo == 201) Serial.println("OK");
  else { Serial.print("Error "); Serial.println(codigo); }
  http.end();
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RX2_PIN, TX2_PIN);
  Serial.println("ESP32 iniciado");

  WiFi.begin(ssid, password);
  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi conectado!");
}

void loop() {
  if (Serial2.available()) {
    String datos = Serial2.readStringUntil('\n');
    datos.trim();
    if (datos.length() == 0) return;
    if (datos[0] == ',') datos = "1" + datos;

    Serial.print("recibido -> ");
    Serial.println(datos);

    // Separar por |
    int fin = datos.indexOf('|');
    String parte1 = (fin < 0) ? datos : datos.substring(0, fin);
    String resto = (fin < 0) ? "" : datos.substring(fin + 1);
    int fin2 = resto.indexOf('|');
    String parte2 = (fin2 < 0) ? resto : resto.substring(0, fin2);
    String parte3 = (fin2 < 0) ? "" : resto.substring(fin2 + 1);

    // Area 1 - Servidores
    if (parte1.length() > 0) {
      int id = getValue(parte1, ',', 0).toInt();
      if (id == 1) {
        int humo = getValue(parte1, ',', 1).toInt();
        int temp = getValue(parte1, ',', 2).toInt();
        int alerta = getValue(parte1, ',', 3).toInt();

        if (humo != ultSrvHumo || temp != ultSrvTemp || alerta != ultSrvAlerta) {
          ultSrvHumo = humo; ultSrvTemp = temp; ultSrvAlerta = alerta;
          Serial.print("servidores -> ");
          Serial.print(temp); Serial.print(", "); Serial.print(humo); Serial.print(", "); Serial.println(alerta);
          if (WiFi.status() == WL_CONNECTED) {
            String json = "{\"temperatura\":" + String(temp) + ",\"humo\":" + String(humo) + ",\"alerta\":" + String(alerta) + "}";
            enviarPost(serverSrv, json);
          }
        }
      }
    }

    // Area 3 - Jardin
    if (parte3.length() > 0) {
      int id = getValue(parte3, ',', 0).toInt();
      if (id == 3) {
        int humSuelo = getValue(parte3, ',', 1).toInt();
        int temp = getValue(parte3, ',', 2).toInt();
        int humAire = getValue(parte3, ',', 3).toInt();

        if (humSuelo != ultJarSuelo || temp != ultJarTemp || humAire != ultJarAire) {
          ultJarSuelo = humSuelo; ultJarTemp = temp; ultJarAire = humAire;
          Serial.print("jardin -> ");
          Serial.print(humSuelo); Serial.print(", "); Serial.print(temp); Serial.print(", "); Serial.println(humAire);
          if (WiFi.status() == WL_CONNECTED) {
            String json = "{\"humedad_suelo\":" + String(humSuelo) + ",\"temperatura\":" + String(temp) + ",\"humedad_aire\":" + String(humAire) + "}";
            enviarPost(serverJar, json);
          }
        }
      }
    }
  }
  delay(50);
}
