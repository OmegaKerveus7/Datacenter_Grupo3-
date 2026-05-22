#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "esp_task_wdt.h"

const char* ssid = "Omega";
const char* password = "d5adc4a32689";
const char* serverSrv = "http://192.168.1.49:3000/area/servidores";
const char* serverPue = "http://192.168.1.49:3000/area/puertas";
const char* serverJar = "http://192.168.1.49:3000/area/jardin";
const char* serverCmdPend = "http://192.168.1.49:3000/api/comandos/pendientes";

#define RX2_PIN 16
#define TX2_PIN 17

int ultSrvHumo = -1, ultSrvTemp = -1, ultSrvHumedad = -1, ultSrvAlerta = -1, ultSrvFan = -1;
int ultPueBtn1 = -1, ultPueBtn2 = -1, ultPuePir = -1, ultPueP1 = -1, ultPueP2 = -1, ultPueAlerta = -1;
int ultJarSuelo = -1, ultJarTemp = -1, ultJarAire = -1;

unsigned long lastCmdCheck = 0;
const unsigned long CMD_INTERVAL = 2000;

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

String httpGet(const char* url) {
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int codigo = http.GET();
  if (codigo == 200) {
    String resp = http.getString();
    http.end();
    return resp;
  }
  http.end();
  return "";
}

void checkPendingCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  String resp = httpGet(serverCmdPend);
  if (resp.length() == 0 || resp == "[]") return;

  // Parse JSON array
  int pos = 0;
  while (true) {
    int idStart = resp.indexOf("\"id\":", pos);
    if (idStart < 0) break;
    idStart += 5;
    int idEnd = resp.indexOf(",", idStart);
    int id = resp.substring(idStart, idEnd).toInt();

    int cmdStart = resp.indexOf("\"comando\":\"", idEnd);
    if (cmdStart < 0) break;
    cmdStart += 11;
    int cmdEnd = resp.indexOf("\"", cmdStart);
    String comando = resp.substring(cmdStart, cmdEnd);

    Serial.print("Comando pendiente: ");
    Serial.print(comando);
    Serial.print(" (id: ");
    Serial.print(id);
    Serial.println(")");

    // Enviar comando al Mega via Serial2
    Serial2.print("CMD,");
    Serial2.print(comando);
    Serial2.println();

    // Marcar como ejecutado
    char url[100];
    snprintf(url, sizeof(url), "http://192.168.1.49:3000/api/comandos/%d/ejecutar", id);
    HTTPClient http;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    int codigo = http.POST("{}");
    if (codigo == 200) Serial.println("  -> Comando ejecutado OK");
    else { Serial.print("  -> Error al confirmar: "); Serial.println(codigo); }
    http.end();

    pos = cmdEnd + 1;
  }
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RX2_PIN, TX2_PIN);
  Serial.println("ESP32 iniciado");

  esp_task_wdt_config_t wdt_config = {
    .timeout_ms = 10000,
    .idle_core_mask = (1 << 0),
    .trigger_panic = true
  };
  esp_task_wdt_init(&wdt_config);
  esp_task_wdt_add(NULL);

  WiFi.begin(ssid, password);
  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi conectado!");
}

void loop() {
  esp_task_wdt_reset();
  // Leer datos del Mega
  if (Serial2.available()) {
    String datos = Serial2.readStringUntil('\n');
    datos.trim();
    if (datos.length() == 0) return;
    if (datos[0] == ',') datos = "1" + datos;

    Serial.print("recibido -> ");
    Serial.println(datos);

    int fin = datos.indexOf('|');
    String parte1 = (fin < 0) ? datos : datos.substring(0, fin);
    String resto = (fin < 0) ? "" : datos.substring(fin + 1);
    int fin2 = resto.indexOf('|');
    String parte2 = (fin2 < 0) ? resto : resto.substring(0, fin2);
    String parte3 = (fin2 < 0) ? "" : resto.substring(fin2 + 1);

    if (parte1.length() > 0) {
      int id = getValue(parte1, ',', 0).toInt();
      if (id == 1) {
        int humo = getValue(parte1, ',', 1).toInt();
        int temp = getValue(parte1, ',', 2).toInt();
        int humedad = getValue(parte1, ',', 3).toInt();
        int alerta = getValue(parte1, ',', 4).toInt();
        int fan = getValue(parte1, ',', 5).toInt();

        if (humo != ultSrvHumo || temp != ultSrvTemp || humedad != ultSrvHumedad || alerta != ultSrvAlerta || fan != ultSrvFan) {
          ultSrvHumo = humo; ultSrvTemp = temp; ultSrvHumedad = humedad; ultSrvAlerta = alerta; ultSrvFan = fan;
          Serial.print("servidores -> ");
          Serial.print(temp); Serial.print(", "); Serial.print(humo); Serial.print(", "); Serial.print(humedad); Serial.print(", "); Serial.print(alerta); Serial.print(", "); Serial.println(fan);
          if (WiFi.status() == WL_CONNECTED) {
            String json = "{\"temperatura\":" + String(temp) + ",\"humo\":" + String(humo) + ",\"humedad\":" + String(humedad) + ",\"alerta\":" + String(alerta) + ",\"fan\":" + String(fan) + "}";
            enviarPost(serverSrv, json);
          }
        }
      }
    }

    if (parte2.length() > 0) {
      int id = getValue(parte2, ',', 0).toInt();
      if (id == 2) {
        int btn1 = getValue(parte2, ',', 1).toInt();
        int btn2 = getValue(parte2, ',', 2).toInt();
        int pir = getValue(parte2, ',', 3).toInt();
        int puerta1 = getValue(parte2, ',', 4).toInt();
        int puerta2 = getValue(parte2, ',', 5).toInt();
        int alerta = getValue(parte2, ',', 6).toInt();

        if (btn1 != ultPueBtn1 || btn2 != ultPueBtn2 || pir != ultPuePir || puerta1 != ultPueP1 || puerta2 != ultPueP2 || alerta != ultPueAlerta) {
          ultPueBtn1 = btn1; ultPueBtn2 = btn2; ultPuePir = pir; ultPueP1 = puerta1; ultPueP2 = puerta2; ultPueAlerta = alerta;
          Serial.print("puertas -> ");
          Serial.print(btn1); Serial.print(", "); Serial.print(btn2); Serial.print(", "); Serial.print(pir); Serial.print(", ");
          Serial.print(puerta1); Serial.print(", "); Serial.print(puerta2); Serial.print(", "); Serial.println(alerta);
          if (WiFi.status() == WL_CONNECTED) {
            String json = "{\"btn1\":" + String(btn1) + ",\"btn2\":" + String(btn2) + ",\"pir\":" + String(pir) +
                          ",\"puerta1\":" + String(puerta1) + ",\"puerta2\":" + String(puerta2) + ",\"alerta\":" + String(alerta) + "}";
            enviarPost(serverPue, json);
          }
        }
      }
    }

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

  // Polling de comandos pendientes cada 2s
  if (millis() - lastCmdCheck > CMD_INTERVAL) {
    lastCmdCheck = millis();
    checkPendingCommands();
  }

  delay(50);
}
