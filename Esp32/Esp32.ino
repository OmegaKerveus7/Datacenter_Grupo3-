#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "Omega";
const char* password = "d5adc4a32689";
const char* serverName = "http://192.168.1.49:3000/area/servidores";

#define RX2_PIN 16
#define TX2_PIN 17

int ultimoHumo = -1;
int ultimaTemp = -1;
int ultimaAlerta = -1;

String getValue(String data, char sep, int idx) {
  int encontrados = 0;
  int inicio = 0;
  for (int i = 0; i <= data.length(); i++) {
    if (i == data.length() || data[i] == sep) {
      if (encontrados == idx) return data.substring(inicio, i);
      encontrados++;
      inicio = i + 1;
    }
  }
  return "";
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RX2_PIN, TX2_PIN);
  Serial.println("ESP32 iniciado");

  WiFi.begin(ssid, password);
  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado!");
}

void loop() {
  if (Serial2.available()) {
    String datos = Serial2.readStringUntil('\n');
    datos.trim();

    if (datos.length() == 0) return;

    // Recuperar area 1 si se pierde el primer byte
    if (datos[0] == ',') datos = "1" + datos;

    // Extraer solo area 1 (servidores)
    int fin = datos.indexOf('|');
    String parte = (fin < 0) ? datos : datos.substring(0, fin);
    int id = getValue(parte, ',', 0).toInt();

    if (id != 1) return;

    int humo = getValue(parte, ',', 1).toInt();
    int temp = getValue(parte, ',', 2).toInt();
    int alerta = getValue(parte, ',', 3).toInt();

    Serial.print("recibido -> ");
    Serial.print(humo);
    Serial.print(", ");
    Serial.print(temp);
    Serial.print(", ");
    Serial.println(alerta);

    if (humo != ultimoHumo || temp != ultimaTemp || alerta != ultimaAlerta) {
      ultimoHumo = humo;
      ultimaTemp = temp;
      ultimaAlerta = alerta;

      if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverName);
        http.addHeader("Content-Type", "application/json");

        String json = "{\"temperatura\":" + String(temp) +
                      ",\"humo\":" + String(humo) +
                      ",\"alerta\":" + String(alerta) + "}";

        Serial.print("enviando -> ");
        Serial.println(json);

        int codigo = http.POST(json);

        if (codigo == 200 || codigo == 201) {
          Serial.println("OK");
        } else {
          Serial.print("Error HTTP: ");
          Serial.println(codigo);
        }

        http.end();
      }
    }
  }

  delay(50);
}
